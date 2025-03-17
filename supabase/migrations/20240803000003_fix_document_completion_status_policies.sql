-- Fix policies for document_completion_status table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Accountants can see their clients' document completion statuses" ON public.document_completion_status;
DROP POLICY IF EXISTS "Clients can see their own document completion statuses" ON public.document_completion_status;
DROP POLICY IF EXISTS "Clients can update their own document completion statuses" ON public.document_completion_status;
DROP POLICY IF EXISTS "Clients can insert their own document completion statuses" ON public.document_completion_status;

-- Recreate policies
-- Accountants can see all document completion statuses for their clients
CREATE POLICY "Accountants can see their clients' document completion statuses"
    ON public.document_completion_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_id
            AND c.user_id = auth.uid()
        )
    );

-- Clients can see their own document completion statuses
CREATE POLICY "Clients can see their own document completion statuses"
    ON public.document_completion_status
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_id
            AND c.client_user_id = auth.uid()
        )
    );

-- Clients can update their own document completion statuses
CREATE POLICY "Clients can update their own document completion statuses"
    ON public.document_completion_status
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_id
            AND c.client_user_id = auth.uid()
        )
    );

-- Clients can insert their own document completion statuses
CREATE POLICY "Clients can insert their own document completion statuses"
    ON public.document_completion_status
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients c
            WHERE c.id = client_id
            AND c.client_user_id = auth.uid()
        )
    );