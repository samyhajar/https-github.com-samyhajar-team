-- Migration to add a database function that will fix RLS policies
CREATE OR REPLACE FUNCTION public.fix_client_policies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Drop any existing policy
  DROP POLICY IF EXISTS "Clients can create their own record" ON public.clients;

  -- Create a policy that allows clients to create their own record
  CREATE POLICY "Clients can create their own record"
  ON public.clients FOR INSERT
  WITH CHECK (client_user_id = auth.uid());

  -- Add a comment to explain this policy
  COMMENT ON POLICY "Clients can create their own record" ON public.clients
  IS 'Allows clients to create their own client record during registration';

  -- Return success status
  RETURN jsonb_build_object(
    'success', true,
    'message', 'RLS policies fixed successfully',
    'timestamp', now()
  );
END;
$$;

-- Create the function that can be called via RPC endpoint
CREATE OR REPLACE FUNCTION public.apply_client_registration_policy()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Drop any existing policy
  DROP POLICY IF EXISTS "Clients can create their own record" ON public.clients;

  -- Create a policy that allows clients to create their own record
  CREATE POLICY "Clients can create their own record"
  ON public.clients FOR INSERT
  WITH CHECK (client_user_id = auth.uid());

  -- Create a separate policy for accountants to create client records
  DROP POLICY IF EXISTS "Accountants can create client records" ON public.clients;
  CREATE POLICY "Accountants can create client records"
  ON public.clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

  -- Add a comment to explain this policy
  COMMENT ON POLICY "Clients can create their own record" ON public.clients
  IS 'Allows clients to create their own client record during registration';

  COMMENT ON POLICY "Accountants can create client records" ON public.clients
  IS 'Allows accountants to create client records for their clients';

  -- Ensure clients can view/update their own records
  DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
  CREATE POLICY "Clients can view their own data"
  ON public.clients FOR SELECT
  USING (client_user_id = auth.uid());

  DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
  CREATE POLICY "Clients can update their own data"
  ON public.clients FOR UPDATE
  USING (client_user_id = auth.uid())
  WITH CHECK (client_user_id = auth.uid());

  -- Return success status
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Client registration policies applied successfully',
    'timestamp', now()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_client_registration_policy() TO authenticated;