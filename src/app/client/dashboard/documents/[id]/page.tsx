import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "../../../../../../supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DocumentViewer } from "@/components/client/document-viewer";

export default async function DocumentDetailPage({
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

  // Get document details
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .eq("client_id", clientData.id)
    .single();

  if (documentError || !document) {
    console.error("Error fetching document:", documentError);
    return redirect("/client/dashboard/documents");
  }

  // Determine export format based on document type
  const exportFormat = document.document_type === "bank" ? "xml" : "csv";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/client/dashboard/documents">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Documents
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{document.name}</h1>
          <p className="text-gray-500">
            {document.document_type.charAt(0).toUpperCase() +
              document.document_type.slice(1)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>
            View and manage document information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentViewer document={document} exportFormat={exportFormat} />
        </CardContent>
      </Card>
    </div>
  );
}
