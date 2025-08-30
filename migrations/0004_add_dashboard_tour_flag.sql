ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_dashboard_tour boolean DEFAULT false;
