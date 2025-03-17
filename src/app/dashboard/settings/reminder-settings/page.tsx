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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateReminderSettingsAction } from "./actions";

export default async function ReminderSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch current reminder settings
  const { data: reminderSettings, error } = await supabase
    .from("accountant_reminder_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no settings exist, create default settings
  if (error && error.code === "PGRST116") {
    const { data: newSettings, error: createError } = await supabase
      .from("accountant_reminder_settings")
      .insert({
        user_id: user.id,
        is_enabled: true,
        monthly_days_before: 3,
        quarterly_days_before: 14,
        yearly_days_before: 30,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating default reminder settings:", createError);
    } else {
      // Use the newly created settings
      return <ReminderSettingsForm settings={newSettings} userId={user.id} />;
    }
  }

  return <ReminderSettingsForm settings={reminderSettings} userId={user.id} />;
}

function ReminderSettingsForm({
  settings,
  userId,
}: {
  settings: any;
  userId: string;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reminder Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Reminder Settings</CardTitle>
          <CardDescription>
            Configure when clients should receive reminders based on their
            invoicing frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateReminderSettingsAction}>
            <input type="hidden" name="user_id" value={userId} />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_enabled">Enable Automatic Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send reminders to clients based on their
                    invoicing frequency
                  </p>
                </div>
                <Switch
                  id="is_enabled"
                  name="is_enabled"
                  defaultChecked={settings?.is_enabled}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Reminder Timing</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_days_before">Monthly Clients</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="monthly_days_before"
                        name="monthly_days_before"
                        type="number"
                        defaultValue={settings?.monthly_days_before || 3}
                        min="1"
                        max="15"
                      />
                      <span>days before</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send reminders this many days before the end of the month
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quarterly_days_before">
                      Quarterly Clients
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="quarterly_days_before"
                        name="quarterly_days_before"
                        type="number"
                        defaultValue={settings?.quarterly_days_before || 14}
                        min="1"
                        max="30"
                      />
                      <span>days before</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send reminders this many days before the end of the
                      quarter
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearly_days_before">Yearly Clients</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="yearly_days_before"
                        name="yearly_days_before"
                        type="number"
                        defaultValue={settings?.yearly_days_before || 30}
                        min="1"
                        max="60"
                      />
                      <span>days before</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send reminders this many days before the end of the year
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Save Settings</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
