-- Password reset tokens (single use, short lived)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,              -- sha256(token)
  expires_at TIMESTAMPTZ NOT NULL,       -- e.g. now() + interval '30 minutes'
  used_at TIMESTAMPTZ,                   -- set once consumed
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_expires
  ON password_reset_tokens(user_id, expires_at)
  WHERE used_at IS NULL;
