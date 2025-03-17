"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "../../../supabase/client";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";

interface SendAllRemindersButtonProps {
  reminders: any[];
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

export function SendAllRemindersButton({
  reminders,
  variant = "default",
  size = "default",
  className = "",
  onSuccess,
}: SendAllRemindersButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Filter reminders that are pending and of type email
  const pendingEmailReminders = reminders.filter(
    (reminder) =>
      reminder.status === "pending" && reminder.reminder_type === "email",
  );

  const handleSendAllReminders = async () => {
    if (pendingEmailReminders.length === 0) {
      toast({
        title: "No reminders to send",
        description: "There are no pending email reminders to send",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get accountant info
      const { data: userData } = await supabase.auth.getUser();
      const accountantName =
        userData.user?.user_metadata?.full_name || "Your Accountant";

      // Get all client information in one query
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, email")
        .in(
          "id",
          pendingEmailReminders.map((reminder) => reminder.client_id),
        );

      const clientMap = clients?.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
      }, {});

      let successCount = 0;
      let failCount = 0;

      // Send emails for each reminder
      for (const reminder of pendingEmailReminders) {
        const client = clientMap[reminder.client_id];

        if (!client || !client.email) {
          failCount++;
          continue;
        }

        try {
          // Generate email body
          const emailBody = generateReminderEmailBody({
            clientName: client.name,
            reminderTitle: reminder.title,
            reminderMessage: reminder.message,
            accountantName,
            dueDate: reminder.reminder_date,
          });

          // Send email
          await sendEmail({
            to: client.email,
            subject: reminder.title,
            body: emailBody,
            type: "reminder",
          });

          // Update reminder status
          await supabase
            .from("reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);

          successCount++;
        } catch (error) {
          console.error(`Error sending reminder ${reminder.id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `Successfully sent ${successCount} reminder${successCount !== 1 ? "s" : ""}${failCount > 0 ? `, ${failCount} failed` : ""}.`,
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: `Failed to send any reminders. Please check client emails.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSendAllReminders}
      disabled={isLoading || pendingEmailReminders.length === 0}
    >
      <Mail className="h-4 w-4 mr-1" />
      {isLoading ? "Sending..." : `Send All (${pendingEmailReminders.length})`}
    </Button>
  );
}
