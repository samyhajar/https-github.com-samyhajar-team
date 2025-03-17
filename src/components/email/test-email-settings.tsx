"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string;
};

export function TestEmailSettings({ clients }: { clients: Client[] }) {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    if (!selectedClientId) {
      toast({
        title: "No client selected",
        description: "Please select a client to send a test email to",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          emailType: "reminder",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Test email sent",
          description: "The test email was sent successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to send test email",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test Email</CardTitle>
        <CardDescription>
          Send a test email to verify your email configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="client">Select Client</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent position="popper">
                {clients.length === 0 ? (
                  <SelectItem value="no-clients" disabled>
                    No clients available
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="default"
          onClick={handleSendTestEmail}
          disabled={isSending || !selectedClientId}
        >
          <Mail className="mr-2 h-4 w-4" />
          {isSending ? "Sending..." : "Send Test Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}
