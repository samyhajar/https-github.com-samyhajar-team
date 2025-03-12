-- Add missing RLS policies for clients updating their own records

-- Allow clients to update their own client record (but not create/delete)
DROP POLICY IF EXISTS "Clients can update their own data" ON clients;
CREATE POLICY "Clients can update their own data"
ON clients FOR UPDATE
USING (client_user_id = auth.uid())
WITH CHECK (client_user_id = auth.uid());

-- Add a policy for accountants to create client records using service role
DROP POLICY IF EXISTS "Accountants can create client records" ON clients;
CREATE POLICY "Accountants can create client records"
ON clients FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Double-check view policies to ensure they're set correctly
DROP POLICY IF EXISTS "Accountants can view their own clients" ON clients;
CREATE POLICY "Accountants can view their own clients"
ON clients FOR SELECT
USING (user_id = auth.uid());

-- Just to be sure, explicitly enable RLS on the clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;