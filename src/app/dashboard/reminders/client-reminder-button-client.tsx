"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";

interface ClientReminderButtonProps {
  reminderId: string;
  onClick: () => Promise<void>;
}

export function ClientReminderButtonClient({
  reminderId,
  onClick,
}: ClientReminderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error("Error sending reminder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
    >
      <Mail className="h-4 w-4 mr-1" />
      {isLoading ? "Sending..." : "Send"}
    </Button>
  );
}
