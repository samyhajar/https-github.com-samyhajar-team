import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCircle,
  AlertTriangle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import Link from "next/link";
import { fixClientRecordAction } from "../client-actions";

export default async function ClientDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get client information
  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("*, users!clients_user_id_fkey(full_name, email)")
    .eq("client_user_id", user.id)
    .single();

  if (clientError || !clientData) {
    console.error("Error fetching client data:", clientError);

    // Instead of redirecting, show a message that the account setup is incomplete
    return (
      <div className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <h1 className="text-3xl font-bold">Client Dashboard</h1>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Account Setup Incomplete
              </CardTitle>
              <CardDescription>
                Your client account setup is not complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Your accountant needs to complete your account setup. The client
                record associated with your user account was not found.
              </p>
              <p className="mb-6 text-sm text-muted-foreground">
                Please contact your accountant and ask them to check your
                account setup. You might need to be re-invited or have your
                client record properly configured.
              </p>
              <p className="text-sm">
                User ID: {user.id}
                <br />
                Email: {user.email}
                <br />
                Name: {user.user_metadata?.full_name || "Not set"}
                <br />
                Accountant ID: {user.user_metadata?.accountant_id || "Not set"}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <form action={fixClientRecordAction}>
                  <input type="hidden" name="client_user_id" value={user.id} />
                  <input
                    type="hidden"
                    name="accountant_id"
                    value={user.user_metadata?.accountant_id || ""}
                  />
                  <input
                    type="hidden"
                    name="name"
                    value={
                      user.user_metadata?.full_name ||
                      (user.email ? user.email.split("@")[0] : "Client")
                    }
                  />
                  <input type="hidden" name="email" value={user.email || ""} />
                  <Button type="submit" className="w-full sm:w-auto">
                    Try to Fix Setup
                  </Button>
                </form>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/sign-in">Return to Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get accountant information
  const { data: accountantData, error: accountantError } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", clientData.user_id)
    .single();

  // Get document statistics
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, status")
    .eq("client_id", clientData.id);

  const totalDocuments = documents?.length || 0;
  const pendingDocuments =
    documents?.filter((d) => d.status === "pending_review").length || 0;
  const approvedDocuments =
    documents?.filter((d) => d.status === "approved").length || 0;

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Client Dashboard</h1>

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {user.user_metadata?.full_name || clientData.name}
            </CardTitle>
            <CardDescription className="text-blue-100">
              Manage your documents and communication with your accountant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link
                href="/client/dashboard/documents"
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FileText size={18} />
                <span>View Documents</span>
              </Link>
              <Link
                href="/client/dashboard/upload"
                className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Upload size={18} />
                <span>Upload Documents</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Document Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                <span>Total Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDocuments}</div>
              <p className="text-muted-foreground text-sm mt-1">
                Documents uploaded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <span>Pending Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingDocuments}</div>
              <p className="text-muted-foreground text-sm mt-1">
                Awaiting accountant review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                <span>Approved</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{approvedDocuments}</div>
              <p className="text-muted-foreground text-sm mt-1">
                Processed documents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accountant Information */}
        <Card>
          <CardHeader>
            <CardTitle>Your Accountant</CardTitle>
            <CardDescription>
              Contact information for your accountant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {accountantData?.full_name || "Your Accountant"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {accountantData?.email || ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                asChild
                className="h-auto py-6 flex flex-col items-center justify-center"
              >
                <Link href="/client/dashboard/upload">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="text-lg">Upload Documents</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center"
              >
                <Link href="/client/dashboard/documents">
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg">View Documents</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
