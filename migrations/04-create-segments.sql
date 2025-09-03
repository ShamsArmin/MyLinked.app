CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'dynamic',
  rules_json jsonb,
  owner_user_id uuid REFERENCES users(id),
  is_shared boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  last_refreshed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS segment_memberships (
  segment_id uuid REFERENCES segments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  snapshot_at timestamptz,
  PRIMARY KEY (segment_id, user_id, snapshot_at)
);

CREATE TABLE IF NOT EXISTS segment_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES segments(id) ON DELETE CASCADE,
  member_count integer,
  created_at timestamptz DEFAULT now()
);
