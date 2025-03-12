-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    invoicing_frequency TEXT NOT NULL CHECK (invoicing_frequency IN ('monthly', 'quarterly', 'yearly')),
    next_invoice_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    document_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'in-app')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_notes table for tracking communication history
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
    ON clients FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients"
    ON clients FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients"
    ON clients FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients"
    ON clients FOR DELETE
    USING (user_id = auth.uid());

-- Add RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (user_id = auth.uid());

-- Add RLS policies for reminders table
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
    ON reminders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reminders"
    ON reminders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
    ON reminders FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
    ON reminders FOR DELETE
    USING (user_id = auth.uid());

-- Add RLS policies for client_notes table
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client notes"
    ON client_notes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own client notes"
    ON client_notes FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own client notes"
    ON client_notes FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own client notes"
    ON client_notes FOR DELETE
    USING (user_id = auth.uid());

-- Add realtime for all tables
alter publication supabase_realtime add table clients;
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table reminders;
alter publication supabase_realtime add table client_notes;

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_invoicing_frequency ON clients(invoicing_frequency);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_reminders_client_id ON reminders(client_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_user_id ON client_notes(user_id);