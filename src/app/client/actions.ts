"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function clientRegisterAction(formData: FormData) {
  const supabase = await createClient();

  const token = formData.get("token") as string;
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const full_name = formData.get("full_name") as string;
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm_password") as string;
  const accountant_id = formData.get("accountant_id") as string;

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
  await supabase
    .from("client_invitations")
    .update({ used: true })
    .eq("token", token);

  // Update the client record with the user ID
  if (userData.user) {
    await supabase
      .from("clients")
      .update({
        client_user_id: userData.user.id,
        status: "active",
      })
      .eq("email", email)
      .eq("user_id", accountant_id);
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
  });

  if (error) {
    console.error("Error creating document record:", error);
    return { error: error.message };
  }

  revalidatePath("/client/dashboard/documents");
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
