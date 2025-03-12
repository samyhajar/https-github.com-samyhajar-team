-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert on users table
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
CREATE POLICY "Allow insert for authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow select on users table
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.users;
CREATE POLICY "Allow select for authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow update on users table
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.users;
CREATE POLICY "Allow update for authenticated users"
ON public.users
FOR UPDATE
TO authenticated
USING (true);

-- Add realtime publication for users table
alter publication supabase_realtime add table public.users;

-- Fix subscription check by modifying the function to handle no subscriptions
