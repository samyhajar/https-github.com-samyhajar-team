import { ClientReminderButton } from "@/components/reminders/client-reminder-button";

export function ClientReminderButtonServer({
  reminderId,
  clientName,
  clientEmail,
  reminderTitle,
  reminderMessage,
  reminderDate,
  reminderType,
  status,
}: {
  reminderId: string;
  clientName: string;
  clientEmail?: string;
  reminderTitle: string;
  reminderMessage: string;
  reminderDate: string;
  reminderType: string;
  status: string;
}) {
  // Don't show button if reminder is already sent or if it's not an email reminder
  if (status === "sent" || reminderType !== "email" || !clientEmail) {
    return null;
  }

  return <ClientReminderButton reminderId={reminderId} />;
}
