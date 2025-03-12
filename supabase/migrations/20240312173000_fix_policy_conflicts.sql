-- Migration to fix policy conflicts after adding client RLS policies

-- Drop potentially conflicting policies from previous migrations
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Ensure we have the right policies in place after fixing conflicts

-- For accountants
DROP POLICY IF EXISTS "Accountants can view their own clients" ON clients;
CREATE POLICY "Accountants can view their own clients"
ON clients FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Accountants can create client records" ON clients;
CREATE POLICY "Accountants can create client records"
ON clients FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Accountants can update their clients" ON clients;
CREATE POLICY "Accountants can update their clients"
ON clients FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Accountants can delete their clients" ON clients;
CREATE POLICY "Accountants can delete their clients"
ON clients FOR DELETE
USING (user_id = auth.uid());

-- For clients
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
CREATE POLICY "Clients can view their own data"
ON clients FOR SELECT
USING (client_user_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update their own data" ON clients;
CREATE POLICY "Clients can update their own data"
ON clients FOR UPDATE
USING (client_user_id = auth.uid())
WITH CHECK (client_user_id = auth.uid());

-- Make the policy names clear and consistent
COMMENT ON POLICY "Accountants can view their own clients" ON clients IS 'Allows accountants to view clients they created';
COMMENT ON POLICY "Accountants can create client records" ON clients IS 'Allows accountants to create new client records';
COMMENT ON POLICY "Accountants can update their clients" ON clients IS 'Allows accountants to update clients they created';
COMMENT ON POLICY "Accountants can delete their clients" ON clients IS 'Allows accountants to delete clients they created';
COMMENT ON POLICY "Clients can view their own data" ON clients IS 'Allows clients to view their own client record';
COMMENT ON POLICY "Clients can update their own data" ON clients IS 'Allows clients to update their own client record';