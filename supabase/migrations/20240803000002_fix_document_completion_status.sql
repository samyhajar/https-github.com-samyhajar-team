-- Check if the table exists first
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_completion_status') THEN
        CREATE TABLE public.document_completion_status (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
            document_type TEXT NOT NULL,
            year TEXT NOT NULL,
            month TEXT NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT false,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );

        -- Create index for faster lookups
        CREATE INDEX document_completion_status_client_id_idx ON public.document_completion_status(client_id);
        CREATE INDEX document_completion_status_document_type_idx ON public.document_completion_status(document_type);
        CREATE INDEX document_completion_status_year_month_idx ON public.document_completion_status(year, month);

        -- Enable RLS
        ALTER TABLE public.document_completion_status ENABLE ROW LEVEL SECURITY;

        -- Create policies
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

        -- Enable realtime
        ALTER PUBLICATION supabase_realtime ADD TABLE public.document_completion_status;
    END IF;
END $$;