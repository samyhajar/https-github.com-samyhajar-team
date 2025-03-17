"use server";

import { createClient } from "../../../../supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";

export async function sendClientReminder(reminderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get the reminder with client info
  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("*, clients(name, email)")
    .eq("id", reminderId)
    .eq("user_id", user.id)
    .single();

  if (reminderError || !reminder) {
    console.error("Error fetching reminder:", reminderError);
    throw new Error("Reminder not found");
  }

  // Check if client has an email
  if (!reminder.clients?.email) {
    throw new Error("Client does not have an email address");
  }

  // Generate email body
  const emailBody = generateReminderEmailBody({
    clientName: reminder.clients.name,
    reminderTitle: reminder.title,
    reminderMessage: reminder.message,
    accountantName: user.user_metadata?.full_name || "Your Accountant",
    dueDate: reminder.reminder_date,
  });

  // Send email
  await sendEmail({
    to: reminder.clients.email,
    subject: reminder.title,
    body: emailBody,
    type: "reminder",
  });

  // Update reminder status
  const { error: updateError } = await supabase
    .from("reminders")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", reminderId);

  if (updateError) {
    console.error("Error updating reminder status:", updateError);
    throw new Error("Failed to update reminder status");
  }

  revalidatePath("/dashboard/reminders");
  return { success: true };
}
