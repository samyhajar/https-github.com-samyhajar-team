-- Create accountant_reminder_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.accountant_reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    monthly_days_before INTEGER NOT NULL DEFAULT 3,
    quarterly_days_before INTEGER NOT NULL DEFAULT 14,
    yearly_days_before INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for accountant_reminder_settings
ALTER TABLE public.accountant_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own reminder settings
DROP POLICY IF EXISTS "Users can view their own reminder settings" ON public.accountant_reminder_settings;
CREATE POLICY "Users can view their own reminder settings"
    ON public.accountant_reminder_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own reminder settings
DROP POLICY IF EXISTS "Users can insert their own reminder settings" ON public.accountant_reminder_settings;
CREATE POLICY "Users can insert their own reminder settings"
    ON public.accountant_reminder_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reminder settings
DROP POLICY IF EXISTS "Users can update their own reminder settings" ON public.accountant_reminder_settings;
CREATE POLICY "Users can update their own reminder settings"
    ON public.accountant_reminder_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own reminder settings
DROP POLICY IF EXISTS "Users can delete their own reminder settings" ON public.accountant_reminder_settings;
CREATE POLICY "Users can delete their own reminder settings"
    ON public.accountant_reminder_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add to realtime publication (only if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'accountant_reminder_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.accountant_reminder_settings;
  END IF;
END $$;