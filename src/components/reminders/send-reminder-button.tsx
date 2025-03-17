"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "../../../supabase/client";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";

interface ReminderType {
  id: string;
  title: string;
  message: string;
  reminder_date: string;
  reminder_type: string;
  status: string;
}

interface SendReminderButtonProps {
  reminder: ReminderType;
  clientName: string;
  clientEmail?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

export function SendReminderButton({
  reminder,
  clientName,
  clientEmail,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: SendReminderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleSendReminder = async () => {
    if (!clientEmail) {
      toast({
        title: "Error",
        description: "Client email is missing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get accountant info
      const { data: userData } = await supabase.auth.getUser();
      const accountantName =
        userData.user?.user_metadata?.full_name || "Your Accountant";

      // Generate email body
      const emailBody = generateReminderEmailBody({
        clientName,
        reminderTitle: reminder.title,
        reminderMessage: reminder.message,
        accountantName,
        dueDate: reminder.reminder_date,
      });

      // Send email
      await sendEmail({
        to: clientEmail,
        subject: reminder.title,
        body: emailBody,
        type: "reminder",
      });

      // Update reminder status
      await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if reminder is already sent
  if (reminder.status === "sent") {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSendReminder}
      disabled={isLoading || !clientEmail || reminder.reminder_type !== "email"}
      title={
        !clientEmail
          ? "Client email is missing"
          : reminder.reminder_type !== "email"
            ? "Only email reminders can be sent manually"
            : ""
      }
    >
      <Mail className="h-4 w-4 mr-1" />
      {isLoading ? "Sending..." : "Send"}
    </Button>
  );
}
