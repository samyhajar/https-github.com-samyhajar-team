import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the path from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Parse the path to determine what to download
    const pathParts = path.split("/").filter(Boolean);

    // If it's a single file download
    if (pathParts.length === 5) {
      // Path format: /{clientId}/{year}/{month}/{docType}/{fileName}
      const [clientId, year, month, docType, fileName] = pathParts;

      // Get the document
      const { data: document, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .eq("year", year)
        .eq("month", month)
        .eq("document_type", docType)
        .eq("name", fileName)
        .eq("user_id", user.id)
        .single();

      if (error || !document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }

      // Return the file URL for direct download
      return NextResponse.json({ url: document.file_path });
    }

    // For folder downloads, we need to get all matching documents and create a zip
    // This is a simplified version - in a real implementation, you would:
    // 1. Query all documents matching the path prefix
    // 2. Create a zip file containing all the documents
    // 3. Return a download URL for the zip

    // Example query to get all documents in a folder
    let query = supabase.from("documents").select("*").eq("user_id", user.id);

    // Add filters based on path parts
    if (pathParts.length >= 1) query = query.eq("client_id", pathParts[0]);
    if (pathParts.length >= 2) query = query.eq("year", pathParts[1]);
    if (pathParts.length >= 3) query = query.eq("month", pathParts[2]);
    if (pathParts.length >= 4) query = query.eq("document_type", pathParts[3]);

    const { data: documents, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Error fetching documents" },
        { status: 500 },
      );
    }

    // In a real implementation, you would now create a zip file with these documents
    // For now, we'll just return the list of documents that would be included
    return NextResponse.json({
      message: "Folder download requested",
      path,
      documentCount: documents?.length || 0,
      // In a real implementation, you would return a download URL for the zip
      // downloadUrl: "https://example.com/download/zip/123"
    });
  } catch (error) {
    console.error("Error in download API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
