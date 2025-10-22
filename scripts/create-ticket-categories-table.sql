-- Create table to track frontend ticket categories (independent of Jira status)
CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('In Progress', 'Pending Reply', 'Resolved')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_categories_ticket_key ON public.ticket_categories(ticket_key);

-- Enable Row Level Security
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on ticket_categories" ON public.ticket_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);
