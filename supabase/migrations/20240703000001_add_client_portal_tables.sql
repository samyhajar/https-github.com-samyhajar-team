-- Create client_invitations table
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  accountant_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add client_user_id to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id);

-- Add additional fields to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS month TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount DECIMAL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client_documents', 'client_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on client_invitations
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for client_invitations
DROP POLICY IF EXISTS "Accountants can view their own invitations" ON client_invitations;
CREATE POLICY "Accountants can view their own invitations"
ON client_invitations FOR SELECT
USING (accountant_id = auth.uid());

DROP POLICY IF EXISTS "Accountants can create invitations" ON client_invitations;
CREATE POLICY "Accountants can create invitations"
ON client_invitations FOR INSERT
WITH CHECK (accountant_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can verify token" ON client_invitations;
CREATE POLICY "Anyone can verify token"
ON client_invitations FOR SELECT
USING (token IS NOT NULL);

-- Update policies for clients table
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
CREATE POLICY "Clients can view their own data"
ON clients FOR SELECT
USING (client_user_id = auth.uid());

-- Update policies for documents table
DROP POLICY IF EXISTS "Clients can view their own documents" ON documents;
CREATE POLICY "Clients can view their own documents"
ON documents FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE client_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can upload documents" ON documents;
CREATE POLICY "Clients can upload documents"
ON documents FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE client_user_id = auth.uid()
  )
);

-- Storage policies
DROP POLICY IF EXISTS "Clients can upload their own documents" ON storage.objects;
CREATE POLICY "Clients can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client_documents' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE client_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
CREATE POLICY "Clients can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client_documents' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE client_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Accountants can view client documents" ON storage.objects;
CREATE POLICY "Accountants can view client documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client_documents' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE user_id = auth.uid()
  )
);

-- Add realtime for new tables
alter publication supabase_realtime add table client_invitations;
