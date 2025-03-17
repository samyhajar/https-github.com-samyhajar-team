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
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending reminders that are due today or in the past
    const now = new Date();
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select(
        `
        id, 
        title, 
        message, 
        reminder_type, 
        reminder_date,
        clients(id, name, email, phone),
        users(id, email, full_name)
      `,
      )
      .eq("status", "pending")
      .lte("reminder_date", now.toISOString());

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch reminders",
          details: remindersError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    // Process each reminder
    const results = [];
    for (const reminder of reminders || []) {
      try {
        if (reminder.reminder_type === "email" && reminder.clients?.email) {
          // Generate email body
          const emailBody = generateReminderEmailBody({
            clientName: reminder.clients.name,
            reminderTitle: reminder.title,
            reminderMessage: reminder.message,
            accountantName: reminder.users?.full_name || "Your Accountant",
            dueDate: reminder.reminder_date
              ? new Date(reminder.reminder_date).toLocaleDateString()
              : undefined,
          });

          // Send email
          const { data: emailData, error: emailError } =
            await supabase.functions.invoke("send-email", {
              body: {
                to: reminder.clients.email,
                subject: reminder.title,
                body: emailBody,
                type: "reminder",
              },
            });

          if (emailError) {
            console.error(
              `Error sending email for reminder ${reminder.id}:`,
              emailError,
            );
            results.push({
              id: reminder.id,
              success: false,
              error: emailError,
            });
          } else {
            // Update reminder status
            const { error: updateError } = await supabase
              .from("reminders")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", reminder.id);

            if (updateError) {
              console.error(
                `Error updating reminder ${reminder.id}:`,
                updateError,
              );
            }

            results.push({
              id: reminder.id,
              success: true,
              emailId: emailData?.id,
            });
          }
        } else if (
          reminder.reminder_type === "sms" &&
          reminder.clients?.phone
        ) {
          // For SMS, we would integrate with an SMS service here
          // For now, just mark as sent
          const { error: updateError } = await supabase
            .from("reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);

          results.push({
            id: reminder.id,
            success: true,
            message: "SMS would be sent in production",
          });
        } else {
          // For other types or missing contact info
          const { error: updateError } = await supabase
            .from("reminders")
            .update({
              status: "failed",
              error_message: "Missing contact information or unsupported type",
            })
            .eq("id", reminder.id);

          results.push({
            id: reminder.id,
            success: false,
            error: "Missing contact information or unsupported type",
          });
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({
          id: reminder.id,
          success: false,
          error: error.message,
        });

        // Mark as failed
        await supabase
          .from("reminders")
          .update({ status: "failed", error_message: error.message })
          .eq("id", reminder.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing reminders:", error);
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

// Helper function to generate email body
function generateReminderEmailBody({
  clientName,
  reminderTitle,
  reminderMessage,
  accountantName,
  dueDate,
}: {
  clientName: string;
  reminderTitle: string;
  reminderMessage: string;
  accountantName: string;
  dueDate?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Reminder: ${reminderTitle}</h2>
      <p>Hello ${clientName},</p>
      <p>${reminderMessage}</p>
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ""}
      <p>Please log in to your client portal to take action.</p>
      <p>Best regards,<br>${accountantName}</p>
    </div>
  `;
}
