"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";

export function ClientReminderForm({
  reminderId,
  formAction,
}: {
  reminderId: string;
  formAction: (formData: FormData) => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await formAction(formData);
    } catch (error) {
      console.error("Error sending reminder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleAction}>
      <input type="hidden" name="reminderId" value={reminderId} />
      <Button variant="outline" size="sm" type="submit" disabled={isLoading}>
        <Mail className="h-4 w-4 mr-1" />
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
