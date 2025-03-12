"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText } from "lucide-react";
import { exportDocumentsAction } from "@/app/client/actions";

interface DocumentViewerProps {
  document: any;
  exportFormat: "csv" | "xml";
}

export function DocumentViewer({
  document,
  exportFormat,
}: DocumentViewerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const formData = new FormData();
      formData.append("document_type", document.document_type);
      formData.append("year", document.year);
      formData.append("month", document.month);
      formData.append("format", exportFormat);

      const result = await exportDocumentsAction(formData);

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Document exported as ${exportFormat.toUpperCase()}`,
        });
        // In a real implementation, you would download the file here
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export document",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border rounded-md p-4">
        {document.file_path ? (
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">Document Preview</h3>
            {document.file_path.endsWith(".pdf") ||
            document.file_type === "application/pdf" ? (
              <iframe
                src={document.file_path}
                className="w-full flex-1 min-h-[500px] border"
                title="PDF Preview"
              />
            ) : document.file_type?.startsWith("image/") ? (
              <img
                src={document.file_path}
                alt="Document Preview"
                className="max-w-full max-h-[500px] object-contain mx-auto"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
                <FileText className="h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium">
                  Document Preview Unavailable
                </h3>
                <p className="mt-2">
                  This document type cannot be previewed. Please download to
                  view.
                </p>
                <Button className="mt-4" asChild>
                  <a
                    href={document.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Document
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
            <FileText className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="text-lg font-medium">No Document Available</h3>
            <p className="mt-2">This document has no file attached.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border rounded-md p-6">
          <h3 className="text-lg font-medium mb-4">Document Information</h3>

          <div className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <div className="mt-1 text-gray-700">
                {document.document_type.charAt(0).toUpperCase() +
                  document.document_type.slice(1)}
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <div className="mt-1 text-gray-700">
                {document.description || "No description"}
              </div>
            </div>

            {document.amount && (
              <div>
                <Label>Amount</Label>
                <div className="mt-1 text-gray-700">
                  €{parseFloat(document.amount).toFixed(2)}
                </div>
              </div>
            )}

            <div>
              <Label>Document Date</Label>
              <div className="mt-1 text-gray-700">
                {document.document_date
                  ? new Date(document.document_date).toLocaleDateString()
                  : "Not specified"}
              </div>
            </div>

            {document.reference && (
              <div>
                <Label>Reference Number</Label>
                <div className="mt-1 text-gray-700">{document.reference}</div>
              </div>
            )}

            <div>
              <Label>Upload Date</Label>
              <div className="mt-1 text-gray-700">
                {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1">
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
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild>
              <a
                href={document.file_path}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting
                ? "Exporting..."
                : `Export as ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
