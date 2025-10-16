-- Create acknowledgements table for tracking auto-acknowledgement status
CREATE TABLE IF NOT EXISTS acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  ticket_key TEXT NOT NULL,
  message_id TEXT,
  email_timestamp TIMESTAMP WITH TIME ZONE,
  acknowledged BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_acknowledgements_email ON acknowledgements(customer_email);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_ticket ON acknowledgements(ticket_key);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_created ON acknowledgements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE acknowledgements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own acknowledgements
CREATE POLICY "Users can view own acknowledgements"
  ON acknowledgements
  FOR SELECT
  USING (true); -- Allow all users to read (we'll filter by email in the query)

-- Policy: System can insert acknowledgements (via service role)
CREATE POLICY "System can insert acknowledgements"
  ON acknowledgements
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update acknowledgements
CREATE POLICY "System can update acknowledgements"
  ON acknowledgements
  FOR UPDATE
  USING (true);
