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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploadForm } from "@/components/client/document-upload-form";

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
    console.error("Error fetching client data:", clientError);
    return redirect("/sign-in");
  }

  // Get current year and month for default values
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Documents</h1>

      <Tabs defaultValue="einzahlungen">
        <TabsList className="mb-6">
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
                defaultYear={currentYear.toString()}
                defaultMonth={currentMonth.toString()}
                exportFormat="csv"
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
                defaultYear={currentYear.toString()}
                defaultMonth={currentMonth.toString()}
                exportFormat="csv"
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
                defaultYear={currentYear.toString()}
                defaultMonth={currentMonth.toString()}
                exportFormat="xml"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sonstiges">
          <Card>
            <CardHeader>
              <CardTitle>Upload Sonstiges</CardTitle>
              <CardDescription>
                Upload other miscellaneous documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                documentType="sonstiges"
                clientId={clientData.id}
                defaultYear={currentYear.toString()}
                defaultMonth={currentMonth.toString()}
                exportFormat="csv"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
