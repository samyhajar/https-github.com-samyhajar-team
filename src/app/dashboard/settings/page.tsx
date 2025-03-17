import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { UserCircle, Mail, Bell, Shield, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { manageSubscriptionAction } from "@/app/actions";
import ManageSubscription from "@/components/manage-subscription";
import { Suspense } from "react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const result = await manageSubscriptionAction(user?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Reminders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCircle className="h-12 w-12 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.user_metadata?.full_name || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      defaultValue={user.user_metadata?.full_name || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email || ""}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" placeholder="Your company name" />
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch id="email_notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder_notifications">
                      Reminder Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about upcoming client deadlines
                    </p>
                  </div>
                  <Switch id="reminder_notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="document_notifications">
                      Document Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when clients upload documents
                    </p>
                  </div>
                  <Switch id="document_notifications" defaultChecked />
                </div>

                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input id="current_password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input id="new_password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" />
                </div>

                <div className="flex justify-end">
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two_factor">
                      Enable Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="two_factor" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Client Reminder Settings</CardTitle>
              <CardDescription>
                Configure when clients should receive reminders based on their
                invoicing frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Reminder Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up automatic reminders for different client types
                  </p>
                </div>
                <Button
                  onClick={() =>
                    (window.location.href =
                      "/dashboard/settings/reminder-settings")
                  }
                >
                  Manage Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Current Plan</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">Professional Plan</p>
                    <p className="text-sm text-muted-foreground">
                      $29/month, billed monthly
                    </p>
                  </div>
                  <Suspense fallback={<Button disabled>Manage</Button>}>
                    {result?.url && (
                      <ManageSubscription redirectUrl={result?.url!} />
                    )}
                  </Suspense>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Payment Method</h3>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">
                      Expires 12/2025
                    </p>
                  </div>
                  <Button variant="outline" className="ml-auto">
                    Update
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">Billing History</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border-b">
                    <div>
                      <p className="font-medium">Invoice #1234</p>
                      <p className="text-sm text-muted-foreground">
                        May 1, 2023
                      </p>
                    </div>
                    <p className="font-medium">$29.00</p>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <div>
                      <p className="font-medium">Invoice #1233</p>
                      <p className="text-sm text-muted-foreground">
                        April 1, 2023
                      </p>
                    </div>
                    <p className="font-medium">$29.00</p>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
