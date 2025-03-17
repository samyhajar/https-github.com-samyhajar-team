"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";
import { useToast } from "@/components/ui/use-toast";

export function TestEmailButton({
  clientEmail,
  clientName,
  accountantName,
}: {
  clientEmail: string;
  clientName: string;
  accountantName: string;
}) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    setIsSending(true);
    try {
      const emailBody = generateReminderEmailBody({
        clientName,
        reminderTitle: "Test Reminder",
        reminderMessage: "This is a test reminder email from your accountant.",
        accountantName,
        dueDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
      });

      const result = await sendEmail({
        to: clientEmail,
        subject: "Test Reminder Email",
        body: emailBody,
        type: "reminder",
        testMode: true,
      });

      if (result.success) {
        toast({
          title: "Test email sent",
          description: `A test email was sent to ${clientEmail}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to send test email",
          description: result.error?.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendTestEmail}
      disabled={isSending}
    >
      <Mail className="h-4 w-4 mr-2" />
      {isSending ? "Sending..." : "Send Test Email"}
    </Button>
  );
}
