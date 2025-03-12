"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { uploadDocumentAction } from "@/app/client/actions";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText } from "lucide-react";

interface DocumentUploadFormProps {
  documentType: string;
  clientId: string;
  defaultYear: string;
  defaultMonth: string;
  exportFormat: "csv" | "xml";
}

export function DocumentUploadForm({
  documentType,
  clientId,
  defaultYear,
  defaultMonth,
  exportFormat,
}: DocumentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) =>
    (currentYear - i).toString(),
  );

  // Generate months
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview URL for the file
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowPreview(true);
      } else {
        setPreviewUrl(null);
        setShowPreview(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("document_type", documentType);

    try {
      const result = await uploadDocumentAction(formData);

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowPreview(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select name="year" defaultValue={defaultYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Month</Label>
              <Select name="month" defaultValue={defaultMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="file">Document File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              onChange={handleFileChange}
              required
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the document"
              required
            />
          </div>

          {(documentType === "einzahlungen" || documentType === "ausgaben") && (
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="date">Document Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>

          <div>
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="Invoice or reference number"
            />
          </div>

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </form>
      </div>

      <div className="border rounded-md p-4">
        {showPreview && previewUrl ? (
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-medium mb-2">Document Preview</h3>
            {previewUrl.endsWith(".pdf") ? (
              <iframe
                src={previewUrl}
                className="w-full flex-1 min-h-[400px] border"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[400px] object-contain mx-auto"
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <FileText className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="text-lg font-medium">Document Preview</h3>
            <p className="mt-2">
              Select a document to preview it here. Supported formats: images
              and PDF.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
