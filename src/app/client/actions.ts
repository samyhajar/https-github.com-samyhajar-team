"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fixClientRecord } from "./client-actions";

export async function clientRegisterAction(formData: FormData) {
  const supabase = await createClient();

  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const full_name = formData.get("full_name") as string;
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm_password") as string;
  const accountant_id = formData.get("accountant_id") as string;

  console.log("Client registration starting with data:", {
    token,
    email,
    name,
    accountant_id,
  });

  if (password !== confirm_password) {
    // In a real app, you would handle this error better
    console.error("Passwords do not match");
    return redirect(
      `/client/register?token=${token}&error=passwords_dont_match`,
    );
  }

  // Create the user account
  const { data: userData, error: userError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        is_client: true,
        accountant_id,
      },
    },
  });

  if (userError) {
    console.error("Error creating user:", userError);
    return redirect(
      `/client/register?token=${token}&error=${encodeURIComponent(userError.message)}`,
    );
  }

  // Mark the invitation as used
  const { error: inviteUpdateError } = await supabase
    .from("client_invitations")
    .update({ used: true })
    .eq("token", token);

  if (inviteUpdateError) {
    console.error("Error marking invitation as used:", inviteUpdateError);
  } else {
    console.log("Invitation marked as used successfully");
  }

  // Update the client record with the user ID
  if (userData.user) {
    console.log("User created successfully:", userData.user.id);

    // First, ensure the user exists in the public users table
    console.log("Creating user record in public users table");
    const { error: userInsertError } = await supabase.from("users").insert({
      id: userData.user.id,
      full_name: full_name,
      email: email,
      user_id: userData.user.id,
      created_at: new Date().toISOString(),
    });

    if (userInsertError) {
      console.error("Error creating user record:", userInsertError);
      // Continue anyway as the user might already exist
    } else {
      console.log("User record created successfully in public users table");
    }

    // Try to create or update the client record
    const result = await fixClientRecord(
      userData.user.id,
      accountant_id,
      name || full_name,
      email,
    );

    console.log("Client record fix attempt result:", result);
  }

  return redirect("/client/dashboard");
}

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const document_type = formData.get("document_type") as string;
  const file = formData.get("file") as File;
  const year = formData.get("year") as string;
  const month = formData.get("month") as string;
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const date = formData.get("date") as string;
  const reference = formData.get("reference") as string;

  if (!file) {
    return { error: "No file uploaded" };
  }

  // Get the accountant ID from user metadata
  const accountant_id = user.user_metadata.accountant_id;

  // Get client ID
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("client_user_id", user.id)
    .single();

  if (clientError || !clientData) {
    console.error("Error getting client ID:", clientError);
    return { error: "Client not found" };
  }

  const client_id = clientData.id;

  // Create folder structure: client_id/year/month/document_type
  const folderPath = `${client_id}/${year}/${month}/${document_type}`;
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${folderPath}/${fileName}`;

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("client_documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    return { error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("client_documents").getPublicUrl(filePath);

  // Create document record with metadata
  const { data, error } = await supabase.from("documents").insert({
    client_id,
    user_id: accountant_id,
    name: file.name,
    file_path: publicUrl,
    file_type: file.type,
    file_size: file.size,
    document_type,
    year,
    month,
    description,
    amount: amount ? parseFloat(amount) : null,
    document_date: date,
    reference,
    status: "pending_review",
    uploaded_by: user.id,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating document record:", error);
    return { error: error.message };
  }

  revalidatePath("/client/dashboard/documents");
  return { success: true };
}

export async function markDocumentTypeCompletedAction({
  clientId,
  documentType,
  year,
  month,
}: {
  clientId: string;
  documentType: string;
  year: string;
  month: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get client information to verify ownership
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("id, user_id, name, email")
    .eq("id", clientId)
    .eq("client_user_id", user.id)
    .single();

  if (clientError || !clientData) {
    throw new Error("Client not found or access denied");
  }

  // Check if already marked as completed
  const { data: existingStatus, error: statusCheckError } = await supabase
    .from("document_completion_status")
    .select("*")
    .eq("client_id", clientId)
    .eq("document_type", documentType)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (statusCheckError) {
    console.error("Error checking completion status:", statusCheckError);
    throw new Error("Error checking document status");
  }

  // Update or insert completion status
  const completionDate = new Date().toISOString();

  if (existingStatus) {
    const { error: updateError } = await supabase
      .from("document_completion_status")
      .update({
        is_completed: true,
        completed_at: completionDate,
        updated_at: completionDate,
      })
      .eq("id", existingStatus.id);

    if (updateError) {
      console.error("Error updating completion status:", updateError);
      throw new Error("Failed to mark as completed");
    }
  } else {
    const { error: insertError } = await supabase
      .from("document_completion_status")
      .insert({
        client_id: clientId,
        document_type: documentType,
        year: year,
        month: month,
        is_completed: true,
        completed_at: completionDate,
        created_at: completionDate,
        updated_at: completionDate,
      });

    if (insertError) {
      console.error("Error inserting completion status:", insertError);
      throw new Error("Failed to mark as completed");
    }
  }

  // Get accountant information
  const { data: accountantData, error: accountantError } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", clientData.user_id)
    .single();

  if (!accountantError && accountantData && accountantData.email) {
    // Send notification email to accountant
    try {
      // Import the email utility
      const { sendEmail, generateDocumentCompletionEmailBody } = await import(
        "@/lib/email"
      );

      // Generate email body
      const emailBody = generateDocumentCompletionEmailBody({
        clientName: clientData.name,
        documentType,
        month,
        year,
        accountantName: accountantData.full_name || "Accountant",
      });

      // Send the email
      await sendEmail({
        to: accountantData.email,
        subject: `Client ${clientData.name} has completed ${documentType} uploads`,
        body: emailBody,
        type: "document_completion",
      });

      console.log(
        `Notification email sent to ${accountantData.email} about client ${clientData.name} completing ${documentType} for ${month}/${year}`,
      );
    } catch (emailError) {
      console.error("Error sending notification email:", emailError);
      // We don't throw here as the main action succeeded
    }
  }

  revalidatePath(`/client/dashboard/upload`);
  revalidatePath(`/client/dashboard/documents`);

  return { success: true };
}

export async function exportDocumentsAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const document_type = formData.get("document_type") as string;
  const year = formData.get("year") as string;
  const month = formData.get("month") as string;
  const format = formData.get("format") as string; // csv or xml

  // Get client ID
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("client_user_id", user.id)
    .single();

  if (clientError || !clientData) {
    console.error("Error getting client ID:", clientError);
    return { error: "Client not found" };
  }

  const client_id = clientData.id;

  // Get documents
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", client_id)
    .eq("document_type", document_type)
    .eq("year", year)
    .eq("month", month);

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
    return { error: documentsError.message };
  }

  // In a real implementation, you would generate the CSV or XML file here
  // and return a download URL

  return { success: true, documents };
}
