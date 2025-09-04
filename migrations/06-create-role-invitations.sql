CREATE TABLE IF NOT EXISTS role_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role_id integer NOT NULL,
  invited_by_user_id uuid NOT NULL,
  token text NOT NULL,
  status text DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);
