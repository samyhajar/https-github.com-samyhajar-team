"use client";

import { SendReminderButton } from "./send-reminder-button";

interface ClientReminderButtonWrapperProps {
  reminderId: string;
  clientName: string;
  clientEmail?: string;
  reminderTitle: string;
  reminderMessage: string;
  reminderDate: string;
  reminderType: string;
  status: string;
}

export function ClientReminderButtonWrapper({
  reminderId,
  clientName,
  clientEmail,
  reminderTitle,
  reminderMessage,
  reminderDate,
  reminderType,
  status,
}: ClientReminderButtonWrapperProps) {
  // Reconstruct the reminder object from the props
  const reminder = {
    id: reminderId,
    title: reminderTitle,
    message: reminderMessage,
    reminder_date: reminderDate,
    reminder_type: reminderType,
    status: status,
  };

  return (
    <SendReminderButton
      reminder={reminder}
      clientName={clientName}
      clientEmail={clientEmail}
    />
  );
}
