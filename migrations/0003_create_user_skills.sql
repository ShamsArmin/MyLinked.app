CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL DEFAULT 3,
  description TEXT,
  years_of_experience INTEGER,
  CONSTRAINT user_skills_user_skill_unique UNIQUE (user_id, skill)
);

CREATE INDEX IF NOT EXISTS user_skills_user_id_idx ON user_skills(user_id);
