"use server";

import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";

export async function fixClientRecord(clientUserId: string, accountantId: string, name: string, email: string) {
  try {
    console.log("Attempting to fix client record for:", { clientUserId, accountantId, name, email });

    // Create a Supabase client
    const supabase = await createClient();

    // Check if a client record already exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id")
      .eq("client_user_id", clientUserId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing client:", checkError);
    }

    if (existingClient) {
      console.log("Client record already exists, no need to fix");
      return { success: true, message: "Client record already exists" };
    }

    // Try direct database insertion first (may fail due to RLS)
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        user_id: accountantId,
        client_user_id: clientUserId,
        name: name,
        email: email,
        status: "active",
        invoicing_frequency: "monthly",
        created_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      if (insertError.code === '42501') {
        console.log("RLS policy prevented direct insertion, trying API endpoint");

        // Use the API endpoint as a fallback - fix to avoid window.location which isn't available in server components
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/client/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_user_id: clientUserId,
            accountant_id: accountantId,
            name: name,
            email: email,
          }),
        });

        const result = await response.json();
        if (result.error) {
          console.error("API endpoint error:", result.error);
          return { success: false, error: result.error };
        }

        console.log("Client record created via API endpoint");
        return { success: true, message: "Client record created via API" };
      } else {
        console.error("Unexpected error creating client:", insertError);
        return { success: false, error: insertError.message };
      }
    } else {
      console.log("Client record created directly");
      return { success: true, message: "Client record created directly" };
    }
  } catch (error) {
    console.error("Error in fixClientRecord:", error);
    return { success: false, error: "Unexpected error fixing client record" };
  }
}

export async function fixClientRecordAction(formData: FormData) {
  const clientUserId = formData.get("client_user_id") as string;
  const accountantId = formData.get("accountant_id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await fixClientRecord(clientUserId, accountantId, name, email);

  // Redirect to refresh the page
  return redirect("/client/dashboard");
}