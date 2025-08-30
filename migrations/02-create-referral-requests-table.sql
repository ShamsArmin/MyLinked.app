-- 02-create-referral-requests-table.sql
-- Create the referral_requests table for referral link requests
CREATE TABLE IF NOT EXISTS referral_requests (
  id SERIAL PRIMARY KEY,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_name VARCHAR(100) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(50),
  requester_website VARCHAR(500),
  field_of_work VARCHAR(100),
  description TEXT,
  link_title VARCHAR(100),
  link_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index to quickly find pending requests for a user
CREATE INDEX IF NOT EXISTS idx_referral_requests_target_user
  ON referral_requests(target_user_id);
