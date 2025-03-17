-- Create document_completion_status table to track when document types are marked as completed
CREATE TABLE IF NOT EXISTS document_completion_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a unique constraint to ensure only one status record per client/document_type/year/month
ALTER TABLE document_completion_status 
ADD CONSTRAINT unique_document_completion_status 
UNIQUE (client_id, document_type, year, month);

-- Add RLS policies for document_completion_status
ALTER TABLE document_completion_status ENABLE ROW LEVEL SECURITY;

-- Allow accountants to read completion status for their clients
DROP POLICY IF EXISTS "Accountants can read completion status" ON document_completion_status;
CREATE POLICY "Accountants can read completion status"
ON document_completion_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_completion_status.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Allow accountants to update completion status for their clients
DROP POLICY IF EXISTS "Accountants can update completion status" ON document_completion_status;
CREATE POLICY "Accountants can update completion status"
ON document_completion_status FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_completion_status.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Allow clients to read their own completion status
DROP POLICY IF EXISTS "Clients can read their own completion status" ON document_completion_status;
CREATE POLICY "Clients can read their own completion status"
ON document_completion_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_completion_status.client_id
    AND clients.client_user_id = auth.uid()
  )
);

-- Allow clients to insert their own completion status
DROP POLICY IF EXISTS "Clients can insert their own completion status" ON document_completion_status;
CREATE POLICY "Clients can insert their own completion status"
ON document_completion_status FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_completion_status.client_id
    AND clients.client_user_id = auth.uid()
  )
);

-- Allow clients to update their own completion status
DROP POLICY IF EXISTS "Clients can update their own completion status" ON document_completion_status;
CREATE POLICY "Clients can update their own completion status"
ON document_completion_status FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_completion_status.client_id
    AND clients.client_user_id = auth.uid()
  )
);

-- Enable realtime for document_completion_status
ALTER PUBLICATION supabase_realtime ADD TABLE document_completion_status;

-- Update documents table to allow 'uploaded' status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'uploaded', 'completed'));
