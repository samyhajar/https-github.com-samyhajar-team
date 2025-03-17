-- Set default value for status column
ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'pending_review';

-- Drop and recreate the status check constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (status IN ('pending_review', 'approved', 'rejected'));
