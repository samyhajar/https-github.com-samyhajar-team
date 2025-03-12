"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function RegistrationLink({ notes }: { notes: string | null }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Extract registration link from notes
  const extractRegistrationLink = () => {
    if (!notes) return null;

    const match = notes.match(
      /Registration link: (\/client\/register\?token=[a-zA-Z0-9]+)/,
    );
    return match ? match[1] : null;
  };

  const registrationLink = extractRegistrationLink();
  const fullUrl = registrationLink
    ? `${window.location.origin}${registrationLink}`
    : null;

  const handleCopy = () => {
    if (fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Registration link copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!registrationLink) return null;

  return (
    <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
      <h3 className="font-medium text-blue-800 mb-2">
        Client Registration Link
      </h3>
      <div className="flex gap-2">
        <Input value={fullUrl} readOnly className="flex-1 bg-white" />
        <Button onClick={handleCopy} variant="outline" size="icon">
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-blue-600 mt-2">
        Share this link with your client to complete their registration
      </p>
    </div>
  );
}
