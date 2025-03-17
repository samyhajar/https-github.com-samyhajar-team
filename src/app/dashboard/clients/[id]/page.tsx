import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Bell,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  User,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { DeleteClientButton } from "@/components/client/delete-client-button";
import { AddClientNote } from "@/components/client/add-client-note";
import { AddReminder } from "@/components/client/add-reminder";
import { UploadDocument } from "@/components/client/upload-document";
import { RegistrationLink } from "@/components/client/registration-link";
import { TestEmailButton } from "@/components/client/test-email-button";
import { EmailLogsViewer } from "@/components/client/email-logs-viewer";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get client details
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !client) {
    console.error("Error fetching client:", error);
    return redirect("/dashboard/clients");
  }

  // Get client notes
  const { data: notes } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false });

  // Get client documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false });

  // Get client reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("client_id", params.id)
    .order("reminder_date", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-gray-500">{client.company_name || "No company"}</p>
        </div>
        <div className="flex gap-2">
          <TestEmailButton
            clientEmail={client.email}
            clientName={client.name}
            accountantName={user.user_metadata?.full_name || "Your Accountant"}
          />
          <Button variant="outline" asChild>
            <Link href={`/dashboard/clients/${params.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
          <DeleteClientButton id={params.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{client.email || "No email provided"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <span>{client.phone || "No phone provided"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-400" />
              <span>{client.company_name || "No company provided"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Invoicing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Frequency</p>
                <p className="text-sm text-gray-500">
                  {client.invoicing_frequency.charAt(0).toUpperCase() +
                    client.invoicing_frequency.slice(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Next Invoice</p>
                <p className="text-sm text-gray-500">
                  {client.next_invoice_date
                    ? format(new Date(client.next_invoice_date), "MMMM d, yyyy")
                    : "Not scheduled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">
              Status Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-100 text-green-800"
                      : client.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {client.status.charAt(0).toUpperCase() +
                    client.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(client.created_at), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {client.status === "pending" && (
            <RegistrationLink notes={client.notes} />
          )}
          {client.notes && (
            <p className="whitespace-pre-wrap mt-4">{client.notes}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Reminders
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Communication History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Manage client documents and files
                </CardDescription>
              </div>
              <UploadDocument clientId={params.id} />
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr
                          key={document.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <a
                              href={document.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {document.name}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            {document.document_type}
                          </td>
                          <td className="py-3 px-4">
                            {format(
                              new Date(document.created_at),
                              "MMM d, yyyy",
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                document.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : document.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {document.status.charAt(0).toUpperCase() +
                                document.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={document.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No documents yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a document to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reminders</CardTitle>
                <CardDescription>
                  Schedule and manage client reminders
                </CardDescription>
              </div>
              <AddReminder clientId={params.id} />
            </CardHeader>
            <CardContent>
              {reminders && reminders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Title
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reminders.map((reminder) => (
                        <tr
                          key={reminder.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 font-medium">
                            {reminder.title}
                          </td>
                          <td className="py-3 px-4">
                            {format(
                              new Date(reminder.reminder_date),
                              "MMM d, yyyy",
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {reminder.reminder_type}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                reminder.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : reminder.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {reminder.status.charAt(0).toUpperCase() +
                                reminder.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="truncate max-w-xs">
                              {reminder.message}
                            </p>
                          </td>
                        </tr>
                      ))}
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
                    Create a reminder to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Communication History</CardTitle>
                <CardDescription>
                  Track client interactions and notes
                </CardDescription>
              </div>
              <AddClientNote clientId={params.id} />
            </CardHeader>
            <CardContent>
              {notes && notes.length > 0 ? (
                <div className="space-y-6">
                  {notes.map((note) => (
                    <div key={note.id} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">
                          {format(
                            new Date(note.created_at),
                            "MMMM d, yyyy 'at' h:mm a",
                          )}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No notes yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a note to track client communication.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <EmailLogsViewer />
      </div>
    </div>
  );
}
