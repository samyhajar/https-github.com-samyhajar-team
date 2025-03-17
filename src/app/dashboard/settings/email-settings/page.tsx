import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmailLogsViewer } from "@/components/client/email-logs-viewer";
import { TestEmailSettings } from "@/components/email/test-email-settings";

export default async function EmailSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get clients for test emails
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Email Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure email settings for client communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Emails are currently configured to be sent through the system's
              default email service. In a production environment, you would
              configure your own email service provider here.
            </p>

            <div className="mt-6">
              <TestEmailSettings clients={clients || []} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger Reminder Processing</CardTitle>
            <CardDescription>
              Manually trigger the reminder processing function
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This will process all pending reminders that are due today or in
              the past. In a production environment, this would be triggered by
              a scheduled cron job.
            </p>

            <form
              action={async () => {
                "use server";
                try {
                  const supabase = await createClient();
                  await supabase.functions.invoke("send-client-reminders");
                } catch (error) {
                  console.error("Error triggering reminders:", error);
                }
              }}
            >
              <Button type="submit">Process Pending Reminders</Button>
            </form>
          </CardContent>
        </Card>

        <EmailLogsViewer />
      </div>
    </div>
  );
}
