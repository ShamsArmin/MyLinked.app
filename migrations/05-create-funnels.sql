CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anon_id text,
  session_id text,
  event_key text NOT NULL,
  occurred_at timestamptz NOT NULL,
  props jsonb
);

CREATE TABLE IF NOT EXISTS ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  anon_id text,
  experiment_key text NOT NULL,
  variant_label text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_user_id uuid,
  tags text[] DEFAULT '{}',
  window_seconds int NOT NULL,
  scope text NOT NULL DEFAULT 'user',
  dedupe text NOT NULL DEFAULT 'first_touch',
  segment_id uuid,
  experiment_key text,
  steps_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE IF NOT EXISTS funnel_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES funnels(id) ON DELETE CASCADE,
  range_start timestamptz NOT NULL,
  range_end timestamptz NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  stats_json jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_key_time ON events (event_key, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events (user_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_session_time ON events (session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_funnel_runs_funnel ON funnel_runs (funnel_id, range_start, range_end);
