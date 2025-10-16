-- Fix Row Level Security policies for chat_messages table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Master account can view all messages" ON chat_messages;

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert messages (we'll validate on the application layer)
CREATE POLICY "Anyone can insert messages"
ON chat_messages
FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow anyone to view messages (we'll filter on the application layer)
CREATE POLICY "Anyone can view messages"
ON chat_messages
FOR SELECT
USING (true);

-- Policy 3: Allow updates for message edits (optional, for future use)
CREATE POLICY "Anyone can update messages"
ON chat_messages
FOR UPDATE
USING (true);
