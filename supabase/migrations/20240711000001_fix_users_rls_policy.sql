-- Migration to fix RLS policy for the users table to allow user creation during registration
-- This solves the error: "new row violates row-level security policy for table users"

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow unauthenticated insert for users" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;

-- Create policy to allow any user (including unauthenticated) to insert into users table
-- This is necessary for user creation during the registration flow
CREATE POLICY "Allow unauthenticated insert for users"
ON public.users
FOR INSERT
TO public  -- This allows both authenticated and anon users
WITH CHECK (true);

-- Create policy for authenticated users to manage their own data
CREATE POLICY "Users can manage their own data"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own data"
ON public.users
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Add comments to explain these policies
COMMENT ON POLICY "Allow unauthenticated insert for users" ON public.users
IS 'Allows users to create their profile during registration';

COMMENT ON POLICY "Users can manage their own data" ON public.users
IS 'Allows users to view their own profile data';

COMMENT ON POLICY "Users can update their own data" ON public.users
IS 'Allows users to update their own profile data';

COMMENT ON POLICY "Users can delete their own data" ON public.users
IS 'Allows users to delete their own profile data';