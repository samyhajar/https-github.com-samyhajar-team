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
import {
  Bell,
  Search,
  Filter,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default async function RemindersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get all reminders for the user
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*, clients(name)")
    .eq("user_id", user.id)
    .order("reminder_date", { ascending: true });

  if (error) {
    console.error("Error fetching reminders:", error);
  }

  // Group reminders by status and date
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const overdueReminders =
    reminders?.filter(
      (reminder) =>
        isBefore(new Date(reminder.reminder_date), today) &&
        reminder.status === "pending",
    ) || [];

  const todayReminders =
    reminders?.filter(
      (reminder) =>
        format(new Date(reminder.reminder_date), "yyyy-MM-dd") ===
        format(today, "yyyy-MM-dd"),
    ) || [];

  const tomorrowReminders =
    reminders?.filter(
      (reminder) =>
        format(new Date(reminder.reminder_date), "yyyy-MM-dd") ===
        format(tomorrow, "yyyy-MM-dd"),
    ) || [];

  const thisWeekReminders =
    reminders?.filter(
      (reminder) =>
        isAfter(new Date(reminder.reminder_date), today) &&
        isBefore(new Date(reminder.reminder_date), nextWeek) &&
        format(new Date(reminder.reminder_date), "yyyy-MM-dd") !==
          format(tomorrow, "yyyy-MM-dd"),
    ) || [];

  // Group by type
  const emailReminders =
    reminders?.filter((reminder) => reminder.reminder_type === "email") || [];
  const smsReminders =
    reminders?.filter((reminder) => reminder.reminder_type === "sms") || [];
  const inAppReminders =
    reminders?.filter((reminder) => reminder.reminder_type === "in-app") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reminders</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input placeholder="Search reminders..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={18} />
          <span>Filter</span>
        </Button>
      </div>

      {/* Reminder Categories by Date */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card
          className={
            overdueReminders.length > 0 ? "border-red-300 bg-red-50" : ""
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell size={18} className="text-red-500" />
              <span>Overdue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <span>Today</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" />
              <span>Tomorrow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar size={18} className="text-purple-500" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekReminders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reminder Categories by Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Mail size={18} className="text-blue-500" />
              <span>Email Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Smartphone size={18} className="text-green-500" />
              <span>SMS Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smsReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-500" />
              <span>In-App Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inAppReminders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reminder List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>
            View and manage all client reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders && reminders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Client</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => {
                    const reminderDate = new Date(reminder.reminder_date);
                    const isOverdue =
                      isBefore(reminderDate, today) &&
                      reminder.status === "pending";

                    return (
                      <tr
                        key={reminder.id}
                        className={`border-b hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}
                      >
                        <td className="py-3 px-4 font-medium">
                          {reminder.title}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/dashboard/clients/${reminder.client_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {reminder.clients?.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              isOverdue ? "text-red-600 font-medium" : ""
                            }
                          >
                            {format(reminderDate, "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reminder.reminder_type === "email"
                                ? "bg-blue-100 text-blue-800"
                                : reminder.reminder_type === "sms"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {reminder.reminder_type === "in-app"
                              ? "In-App"
                              : reminder.reminder_type.charAt(0).toUpperCase() +
                                reminder.reminder_type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reminder.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : reminder.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : isOverdue
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isOverdue && reminder.status === "pending"
                              ? "Overdue"
                              : reminder.status.charAt(0).toUpperCase() +
                                reminder.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="truncate max-w-xs">
                            {reminder.message}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No reminders yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create reminders from client profiles.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
