-- Migration 018: Add photo_url column to care_history table
-- Allows volunteers to attach photos when recording care activities

ALTER TABLE care_history
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL;