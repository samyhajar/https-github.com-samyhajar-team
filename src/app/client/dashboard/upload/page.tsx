import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { DocumentUploadForm } from "@/components/client/document-upload-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UploadDocumentsPage() {
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
    return redirect("/client/dashboard");
  }

  // Get completion status for all document types
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const { data: completionStatus, error: completionError } = await supabase
    .from("document_completion_status")
    .select("*")
    .eq("client_id", clientData.id)
    .eq("year", currentYear)
    .eq("month", currentMonth)
    .eq("is_completed", true);

  if (completionError) {
    console.error("Error fetching completion status:", completionError);
  }

  // Create a map of document types that are completed
  const completedDocTypes = new Map();
  completionStatus?.forEach((status) => {
    completedDocTypes.set(status.document_type, true);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/client/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Upload Documents</h1>

      <Tabs defaultValue="einzahlungen" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="einzahlungen">Einzahlungen</TabsTrigger>
          <TabsTrigger value="ausgaben">Ausgaben</TabsTrigger>
          <TabsTrigger value="bank">Bank Reports</TabsTrigger>
          <TabsTrigger value="sonstiges">Sonstiges</TabsTrigger>
        </TabsList>

        <TabsContent value="einzahlungen">
          <Card>
            <CardHeader>
              <CardTitle>Upload Einzahlungen</CardTitle>
              <CardDescription>
                Upload your income documents and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                documentType="einzahlungen"
                clientId={clientData.id}
                defaultYear={currentYear}
                defaultMonth={currentMonth}
                exportFormat="csv"
                isCompleted={completedDocTypes.get("einzahlungen") || false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ausgaben">
          <Card>
            <CardHeader>
              <CardTitle>Upload Ausgaben</CardTitle>
              <CardDescription>
                Upload your expense documents and receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                documentType="ausgaben"
                clientId={clientData.id}
                defaultYear={currentYear}
                defaultMonth={currentMonth}
                exportFormat="csv"
                isCompleted={completedDocTypes.get("ausgaben") || false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Upload Bank Reports</CardTitle>
              <CardDescription>
                Upload your bank statements and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                documentType="bank"
                clientId={clientData.id}
                defaultYear={currentYear}
                defaultMonth={currentMonth}
                exportFormat="xml"
                isCompleted={completedDocTypes.get("bank") || false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sonstiges">
          <Card>
            <CardHeader>
              <CardTitle>Upload Sonstiges</CardTitle>
              <CardDescription>
                Upload other documents that don't fit in the categories above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                documentType="sonstiges"
                clientId={clientData.id}
                defaultYear={currentYear}
                defaultMonth={currentMonth}
                exportFormat="csv"
                isCompleted={completedDocTypes.get("sonstiges") || false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
