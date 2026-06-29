-- Add proof columns to emergency_reports for volunteers to submit fix proof
ALTER TABLE emergency_reports
  ADD COLUMN IF NOT EXISTS proof_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS proof_image_url VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS proof_submitted_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ NULL;
