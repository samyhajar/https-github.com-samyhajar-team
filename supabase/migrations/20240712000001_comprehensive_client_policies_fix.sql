-- Migration to consolidate and fix all client-related RLS policies
-- This addresses issues with client record creation and management

-- Enable RLS if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- CLIENT CREATION POLICIES
--------------------------------------------------------------------------------

-- Drop any existing policies that might conflict with client record creation
DROP POLICY IF EXISTS "Clients can create their own record" ON public.clients;

-- Create policy to allow clients to create their own client record
-- This solves the "new row violates row-level security policy" error during registration
CREATE POLICY "Clients can create their own record"
ON public.clients FOR INSERT
WITH CHECK (client_user_id = auth.uid());

-- Add a comment to explain this policy
COMMENT ON POLICY "Clients can create their own record" ON public.clients
IS 'Allows clients to create their own client record during registration';

--------------------------------------------------------------------------------
-- CLIENT MANAGEMENT POLICIES
--------------------------------------------------------------------------------

-- Ensure clients can view their own data
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data"
ON public.clients FOR SELECT
USING (client_user_id = auth.uid());

-- Ensure clients can update their own data
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
CREATE POLICY "Clients can update their own data"
ON public.clients FOR UPDATE
USING (client_user_id = auth.uid())
WITH CHECK (client_user_id = auth.uid());

--------------------------------------------------------------------------------
-- ACCOUNTANT MANAGEMENT POLICIES
--------------------------------------------------------------------------------

-- Ensure accountants can view their clients
DROP POLICY IF EXISTS "Accountants can view their own clients" ON public.clients;
CREATE POLICY "Accountants can view their own clients"
ON public.clients FOR SELECT
USING (user_id = auth.uid());

-- Ensure accountants can create client records
DROP POLICY IF EXISTS "Accountants can create client records" ON public.clients;
CREATE POLICY "Accountants can create client records"
ON public.clients FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Ensure accountants can update their clients
DROP POLICY IF EXISTS "Accountants can update their clients" ON public.clients;
CREATE POLICY "Accountants can update their clients"
ON public.clients FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure accountants can delete their clients
DROP POLICY IF EXISTS "Accountants can delete their clients" ON public.clients;
CREATE POLICY "Accountants can delete their clients"
ON public.clients FOR DELETE
USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- DATABASE STRUCTURE VALIDATION
--------------------------------------------------------------------------------

-- Ensure we have a column for client_user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'client_user_id'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN client_user_id UUID;
    END IF;
END $$;

-- Add an index for client_user_id for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_clients_client_user_id ON public.clients(client_user_id);

-- Validate that policies are correctly set
SELECT
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'clients'
  AND schemaname = 'public';