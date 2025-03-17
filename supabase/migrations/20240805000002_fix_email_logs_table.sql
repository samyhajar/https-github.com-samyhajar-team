-- Create email_logs table to track all emails sent through the system
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  test_mode BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on the email_logs table
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own email logs
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

-- Allow the service role to manage all email logs
DROP POLICY IF EXISTS "Service role can manage all email logs" ON email_logs;
CREATE POLICY "Service role can manage all email logs"
  ON email_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
