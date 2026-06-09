-- Migration 010: Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  student_name VARCHAR(200) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 16 AND age <= 100),
  faculty VARCHAR(200) NOT NULL,
  interests TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
