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
import { FileText, Download, Filter, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { DocumentViewer } from "@/components/client/document-viewer";

export default async function ClientDocumentsPage() {
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
    .select("id")
    .eq("client_user_id", user.id)
    .single();

  if (clientError || !clientData) {
    console.error("Error fetching client data:", clientError);
    return redirect("/sign-in");
  }

  // Get documents
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientData.id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
  }

  // Group documents by type
  const einzahlungen =
    documents?.filter((doc) => doc.document_type === "einzahlungen") || [];
  const ausgaben =
    documents?.filter((doc) => doc.document_type === "ausgaben") || [];
  const bank = documents?.filter((doc) => doc.document_type === "bank") || [];
  const sonstiges =
    documents?.filter((doc) => doc.document_type === "sonstiges") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Documents</h1>
        <Button asChild>
          <Link href="/client/dashboard/upload">
            <FileText className="mr-2 h-4 w-4" /> Upload New Document
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input placeholder="Search documents..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={18} />
          <span>Filter</span>
        </Button>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              <span>Einzahlungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{einzahlungen.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText size={18} className="text-red-500" />
              <span>Ausgaben</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ausgaben.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText size={18} className="text-green-500" />
              <span>Bank Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bank.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText size={18} className="text-purple-500" />
              <span>Sonstiges</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sonstiges.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            View and manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/client/dashboard/documents/${document.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {document.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            document.document_type === "einzahlungen"
                              ? "bg-blue-100 text-blue-800"
                              : document.document_type === "ausgaben"
                                ? "bg-red-100 text-red-800"
                                : document.document_type === "bank"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {document.document_type.charAt(0).toUpperCase() +
                            document.document_type.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {format(new Date(document.created_at), "MMM d, yyyy")}
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
                          {document.status === "pending_review"
                            ? "Pending Review"
                            : document.status.charAt(0).toUpperCase() +
                              document.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/client/dashboard/documents/${document.id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText size={14} /> View
                          </Link>
                        </div>
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
                Upload your first document to get started.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/client/dashboard/upload">
                    <FileText className="mr-2 h-4 w-4" /> Upload Document
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
