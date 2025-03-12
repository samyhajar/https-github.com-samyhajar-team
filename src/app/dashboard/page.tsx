import ManageSubscription from "@/components/manage-subscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InfoIcon,
  UserCircle,
  Users,
  FileText,
  Bell,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { manageSubscriptionAction } from "../actions";
import { Suspense } from "react";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const result = await manageSubscriptionAction(user?.id);

  if (!result) {
    return redirect("/pricing");
  }

  // Get client counts by invoicing frequency
  const { data: monthlyClients } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .eq("invoicing_frequency", "monthly");

  const { data: quarterlyClients } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .eq("invoicing_frequency", "quarterly");

  const { data: yearlyClients } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .eq("invoicing_frequency", "yearly");

  // Get upcoming reminders
  const { data: upcomingReminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("reminder_date", { ascending: true })
    .limit(5);

  // Get recent documents
  const { data: recentDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Suspense fallback={<div>Loading...</div>}>
            {result?.url && <ManageSubscription redirectUrl={result?.url!} />}
          </Suspense>
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {user.user_metadata?.full_name || user.email}
            </CardTitle>
            <CardDescription className="text-blue-100">
              Manage your clients, documents, and reminders all in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link
                href="/dashboard/clients"
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Users size={18} />
                <span>Manage Clients</span>
              </Link>
              <Link
                href="/dashboard/documents"
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FileText size={18} />
                <span>View Documents</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                <span>Monthly Clients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {monthlyClients?.length || 0}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                30-day invoicing cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                <span>Quarterly Clients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {quarterlyClients?.length || 0}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                90-day invoicing cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Users size={18} className="text-purple-500" />
                <span>Yearly Clients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {yearlyClients?.length || 0}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Annual invoicing cycle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-amber-500" />
                  <span>Upcoming Reminders</span>
                </div>
                <Link
                  href="/dashboard/reminders"
                  className="text-sm text-blue-500 flex items-center gap-1"
                >
                  View All <ArrowUpRight size={14} />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingReminders && upcomingReminders.length > 0 ? (
                <div className="space-y-4">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start gap-3 pb-3 border-b border-gray-100"
                    >
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Clock size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{reminder.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(
                            reminder.reminder_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No upcoming reminders</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-green-500" />
                  <span>Recent Documents</span>
                </div>
                <Link
                  href="/dashboard/documents"
                  className="text-sm text-blue-500 flex items-center gap-1"
                >
                  View All <ArrowUpRight size={14} />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocuments && recentDocuments.length > 0 ? (
                <div className="space-y-4">
                  {recentDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-start gap-3 pb-3 border-b border-gray-100"
                    >
                      <div className="bg-green-100 p-2 rounded-full">
                        <FileText size={16} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{document.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {document.document_type} •{" "}
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle size={20} className="text-primary" />
              <span>User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">
                  {user.user_metadata?.full_name || "User"}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
