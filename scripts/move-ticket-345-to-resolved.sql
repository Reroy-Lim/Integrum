-- Manual update to move ticket KST-345 to Resolved column
-- This updates the frontend category override in Supabase

INSERT INTO ticket_categories (ticket_key, category, updated_at)
VALUES ('KST-345', 'Resolved', NOW())
ON CONFLICT (ticket_key)
DO UPDATE SET 
  category = 'Resolved',
  updated_at = NOW();

-- Verify the update
SELECT * FROM ticket_categories WHERE ticket_key = 'KST-345';
