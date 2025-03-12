-- Migration to allow clients to create their own client records during registration

-- Drop the conflicting policy if it exists
DROP POLICY IF EXISTS "Clients can create their own record" ON clients;

-- Create a policy that allows clients to create their own record
CREATE POLICY "Clients can create their own record"
ON clients FOR INSERT
WITH CHECK (client_user_id = auth.uid());

-- Add a comment to explain this policy
COMMENT ON POLICY "Clients can create their own record" ON clients IS 'Allows clients to create their own client record during registration';

-- Also ensure we have a column for client_user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'client_user_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN client_user_id UUID;
    END IF;
END $$;

-- Add an index for client_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_clients_client_user_id ON clients(client_user_id);