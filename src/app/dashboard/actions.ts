"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const company_name = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const invoicing_frequency = formData.get("invoicing_frequency") as string;
  const next_invoice_date = formData.get("next_invoice_date") as string;
  const notes = formData.get("notes") as string;

  // Create client record with pending status
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name,
      company_name,
      email,
      phone,
      invoicing_frequency,
      next_invoice_date: next_invoice_date
        ? new Date(next_invoice_date).toISOString()
        : null,
      notes,
      status: "pending", // Set as pending until client registers
    })
    .select();

  if (error) {
    console.error("Error creating client:", error);
    return { error: error.message };
  }

  // Instead of creating a user account directly, create an invitation
  if (email) {
    // Generate a unique token for the invitation
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store the invitation in the database
    const { error: inviteError } = await supabase
      .from("client_invitations")
      .insert({
        email,
        name,
        accountant_id: user.id,
        company_name,
        token,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days expiration
      });

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
    } else {
      // Update client status to pending
      await supabase
        .from("clients")
        .update({
          status: "pending",
        })
        .eq("id", data[0].id);

      // Store the token in the client record for easy access
      await supabase
        .from("clients")
        .update({
          notes: notes
            ? `${notes}\n\nRegistration link: /client/register?token=${token}`
            : `Registration link: /client/register?token=${token}`,
        })
        .eq("id", data[0].id);

      console.log(
        `Invitation created for ${email}. Registration link: /client/register?token=${token}`,
      );
    }
  }

  revalidatePath("/dashboard/clients");
  return redirect("/dashboard/clients");
}

async function inviteClientByEmail(
  email: string,
  name: string,
  accountant_id: string,
  company_name?: string,
) {
  const supabase = await createClient();

  // Generate a unique token for the invitation
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Store the invitation in the database
  const { error } = await supabase.from("client_invitations").insert({
    email,
    name,
    accountant_id,
    company_name,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiration
  });

  if (error) {
    console.error("Error creating invitation:", error);
    return { error: error.message };
  }

  // Send email with invitation link
  // In a real implementation, you would use an email service here
  console.log(`Invitation email sent to ${email} with token ${token}`);

  return { success: true };
}

export async function inviteClientAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const name = formData.get("name") as string;
  const company_name = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;

  // Create client record first
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name,
      company_name,
      email,
      phone,
      invoicing_frequency: "monthly", // Default value
      status: "pending",
    })
    .select();

  if (clientError) {
    console.error("Error creating client:", clientError);
    return { error: clientError.message };
  }

  // Send invitation
  const result = await inviteClientByEmail(email, name, user.id, company_name);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/clients");
  return redirect("/dashboard/clients");
}

export async function updateClientAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const company_name = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const invoicing_frequency = formData.get("invoicing_frequency") as string;
  const next_invoice_date = formData.get("next_invoice_date") as string;
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string;

  const { data, error } = await supabase
    .from("clients")
    .update({
      name,
      company_name,
      email,
      phone,
      invoicing_frequency,
      next_invoice_date: next_invoice_date
        ? new Date(next_invoice_date).toISOString()
        : null,
      notes,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating client:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/clients");
  return redirect(`/dashboard/clients/${id}`);
}

export async function deleteClientAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting client:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  return redirect("/dashboard/clients");
}

export async function addClientNoteAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const client_id = formData.get("client_id") as string;
  const note = formData.get("note") as string;

  if (!note.trim()) {
    return { error: "Note cannot be empty" };
  }

  const { data, error } = await supabase.from("client_notes").insert({
    client_id,
    user_id: user.id,
    note,
  });

  if (error) {
    console.error("Error adding note:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${client_id}`);
  return { success: true };
}

export async function createReminderAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const client_id = formData.get("client_id") as string;
  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const reminder_date = formData.get("reminder_date") as string;
  const reminder_type = formData.get("reminder_type") as string;

  const { data, error } = await supabase.from("reminders").insert({
    client_id,
    user_id: user.id,
    title,
    message,
    reminder_date: new Date(reminder_date).toISOString(),
    reminder_type,
  });

  if (error) {
    console.error("Error creating reminder:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${client_id}`);
  revalidatePath("/dashboard/reminders");
  return { success: true };
}

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const client_id = formData.get("client_id") as string;
  const name = formData.get("name") as string;
  const document_type = formData.get("document_type") as string;
  const notes = formData.get("notes") as string;
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file uploaded" };
  }

  // Upload file to storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${user.id}/${client_id}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("documents").getPublicUrl(filePath);

  // Create document record
  const { data, error } = await supabase.from("documents").insert({
    client_id,
    user_id: user.id,
    name,
    file_path: publicUrl,
    file_type: file.type,
    file_size: file.size,
    document_type,
    notes,
  });

  if (error) {
    console.error("Error creating document record:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${client_id}`);
  revalidatePath("/dashboard/documents");
  return { success: true };
}
