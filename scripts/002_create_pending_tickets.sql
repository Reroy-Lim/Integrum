-- Create pending_tickets table for tracking ticket creation status
CREATE TABLE IF NOT EXISTS pending_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  ticket_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'created', 'failed'
  email_timestamp BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_tickets_user_email ON pending_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_pending_tickets_status ON pending_tickets(status);
CREATE INDEX IF NOT EXISTS idx_pending_tickets_created_at ON pending_tickets(created_at);

-- Enable Row Level Security
ALTER TABLE pending_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pending tickets
CREATE POLICY "Users can view own pending tickets"
  ON pending_tickets
  FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can insert their own pending tickets
CREATE POLICY "Users can insert own pending tickets"
  ON pending_tickets
  FOR INSERT
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: System can update any pending ticket (for webhook)
CREATE POLICY "System can update pending tickets"
  ON pending_tickets
  FOR UPDATE
  USING (true);
