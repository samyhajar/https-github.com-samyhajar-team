import { Tables } from "@/types/supabase";

type Document = Tables<"documents">;

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

export function organizeDocumentsIntoTree(documents: Document[]): FileNode[] {
  const clientMap: Record<string, FileNode> = {};

  // First pass: create all nodes
  documents.forEach((doc) => {
    const clientId = doc.client_id;
    const year = doc.year || "Unknown Year";
    const month = doc.month || "Unknown Month";
    const docType = doc.document_type;

    // Create client node if it doesn't exist
    if (!clientMap[clientId]) {
      clientMap[clientId] = {
        id: clientId,
        name: doc.clients?.name || "Unknown Client",
        type: "folder",
        path: `/${clientId}`,
        children: [],
      };
    }

    // Find or create year node
    let yearNode = clientMap[clientId].children?.find(
      (node) => node.name === year,
    );
    if (!yearNode) {
      yearNode = {
        id: `${clientId}-${year}`,
        name: year,
        type: "folder",
        path: `/${clientId}/${year}`,
        children: [],
      };
      clientMap[clientId].children?.push(yearNode);
    }

    // Find or create month node
    let monthNode = yearNode.children?.find((node) => node.name === month);
    if (!monthNode) {
      monthNode = {
        id: `${clientId}-${year}-${month}`,
        name: month,
        type: "folder",
        path: `/${clientId}/${year}/${month}`,
        children: [],
      };
      yearNode.children?.push(monthNode);
    }

    // Find or create document type node
    let docTypeNode = monthNode.children?.find((node) => node.name === docType);
    if (!docTypeNode) {
      docTypeNode = {
        id: `${clientId}-${year}-${month}-${docType}`,
        name: docType,
        type: "folder",
        path: `/${clientId}/${year}/${month}/${docType}`,
        children: [],
      };
      monthNode.children?.push(docTypeNode);
    }

    // Add file node
    docTypeNode.children?.push({
      id: doc.id,
      name: doc.name,
      type: "file",
      path: `/${clientId}/${year}/${month}/${docType}/${doc.name}`,
      fileUrl: doc.file_path,
      fileType: doc.file_type || undefined,
      fileSize: doc.file_size || undefined,
    });
  });

  // Convert the map to an array and sort
  return Object.values(clientMap).sort((a, b) => a.name.localeCompare(b.name));
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
