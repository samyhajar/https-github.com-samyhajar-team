"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";

export function ClientReminderButton({ reminderId }: { reminderId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("reminderId", reminderId);

      // Import the server action directly in the client component
      const { sendClientReminder } = await import(
        "@/app/dashboard/reminders/actions"
      );
      await sendClientReminder(reminderId);
    } catch (error) {
      console.error("Error sending reminder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button variant="outline" size="sm" type="submit" disabled={isLoading}>
        <Mail className="h-4 w-4 mr-1" />
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
