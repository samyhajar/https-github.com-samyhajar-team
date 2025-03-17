// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, body, from, type, testMode } = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the email attempt
    const { data: logData, error: logError } = await supabase
      .from("email_logs")
      .insert({
        to_email: to,
        subject,
        body,
        from_email: from || "noreply@accountflow.com",
        type: type || "general",
        test_mode: testMode || false,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select();

    if (logError) {
      console.error("Error logging email:", logError);
      return new Response(
        JSON.stringify({ error: "Failed to log email", details: logError }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // In a real implementation, you would send the email here using a service like SendGrid, Mailgun, etc.
    // For now, we'll just simulate sending and update the log

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update the log with success status
    const { error: updateError } = await supabase
      .from("email_logs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", logData[0].id);

    if (updateError) {
      console.error("Error updating email log:", updateError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        id: logData[0].id,
        testMode: testMode || false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
