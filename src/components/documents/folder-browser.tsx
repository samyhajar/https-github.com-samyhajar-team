"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
};

type FolderBrowserProps = {
  data: FileNode[];
  className?: string;
};

export function FolderBrowser({ data, className }: FolderBrowserProps) {
  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="p-2">
        {data.map((node) => (
          <FolderNode key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}

type FolderNodeProps = {
  node: FileNode;
  level: number;
};

function FolderNode({ node, level }: FolderNodeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For folders, we would trigger a backend process to zip and download
    // For files, we can directly download
    if (node.type === "file" && node.fileUrl) {
      window.open(node.fileUrl, "_blank");
    } else {
      // This would be an API call to download a zipped folder
      console.log(`Download folder: ${node.path}`);
      // Example API call: fetch(`/api/documents/download?path=${encodeURIComponent(node.path)}`);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md hover:bg-muted cursor-pointer",
          level > 0 && "ml-4",
        )}
        onClick={toggleOpen}
      >
        <div className="mr-1">
          {node.type === "folder" ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : null}
        </div>
        <div className="mr-2">
          {node.type === "folder" ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <div className="flex-1 text-sm">{node.name}</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      {isOpen && node.children && (
        <div className="ml-4">
          {node.children.map((childNode) => (
            <FolderNode key={childNode.id} node={childNode} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
