-- Create chat_messages table for ticket conversations
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_key TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'support')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_key ON chat_messages(ticket_key);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own tickets (based on customer email from ticket)
-- Note: This is a simplified policy. In production, you'd want to join with ticket data
CREATE POLICY "Users can view their ticket messages"
  ON chat_messages
  FOR SELECT
  USING (
    user_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR 
    'heyroy23415@gmail.com' = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Policy: Users can insert messages for their own tickets
CREATE POLICY "Users can insert their own messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    user_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR 
    'heyroy23415@gmail.com' = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Policy: Master account can insert messages with support role
CREATE POLICY "Support can insert support messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    role = 'support' AND 'heyroy23415@gmail.com' = current_setting('request.jwt.claims', true)::json->>'email'
  );
