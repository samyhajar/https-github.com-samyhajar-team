-- Create client_documents bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'client_documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('client_documents', 'Client Documents', true);
  END IF;
END $$;

-- Add policy to allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client_documents');

-- Add policy to allow users to read their own files
DROP POLICY IF EXISTS "Allow users to read their own files" ON storage.objects;
CREATE POLICY "Allow users to read their own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'client_documents');

-- Add policy to allow users to update their own files
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'client_documents');

-- Add policy to allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'client_documents');
