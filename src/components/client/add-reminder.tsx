"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createReminderAction } from "@/app/dashboard/actions";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";
import { createClient } from "../../../supabase/client";

export function AddReminder({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendNow, setSendNow] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("client_id", clientId);

    // Add send_now flag to formData
    formData.append("send_now", sendNow.toString());

    try {
      // Get client information for email if sending now
      let clientData;
      if (sendNow && formData.get("reminder_type") === "email") {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("clients")
          .select("name, email")
          .eq("id", clientId)
          .single();

        if (error) throw error;
        clientData = data;
      }

      const result = await createReminderAction(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        // If sendNow is checked and it's an email reminder, send the email
        if (
          sendNow &&
          formData.get("reminder_type") === "email" &&
          clientData?.email
        ) {
          const { data: userData } = await createClient().auth.getUser();

          const emailBody = generateReminderEmailBody({
            clientName: clientData.name,
            reminderTitle: formData.get("title") as string,
            reminderMessage: formData.get("message") as string,
            accountantName:
              userData.user?.user_metadata?.full_name || "Your Accountant",
            dueDate: formData.get("reminder_date") as string,
          });

          await sendEmail({
            to: clientData.email,
            subject: formData.get("title") as string,
            body: emailBody,
            type: "reminder",
          });

          // Update the reminder status to sent
          if (result.id) {
            await createClient()
              .from("reminders")
              .update({ status: "sent" })
              .eq("id", result.id);
          }
        }

        toast({
          title: "Success",
          description: sendNow
            ? "Reminder created and sent successfully"
            : "Reminder created successfully",
        });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> Add Reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
            <DialogDescription>
              Schedule a reminder for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Invoice Reminder"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminder_date">Reminder Date</Label>
              <Input
                id="reminder_date"
                name="reminder_date"
                type="date"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Reminder Type</Label>
              <RadioGroup defaultValue="email" name="reminder_type">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-app" id="in-app" />
                  <Label htmlFor="in-app">In-App</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Please submit your monthly invoices by the end of the month."
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send_now"
                checked={sendNow}
                onCheckedChange={(checked) => setSendNow(checked as boolean)}
              />
              <Label htmlFor="send_now">Send immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
