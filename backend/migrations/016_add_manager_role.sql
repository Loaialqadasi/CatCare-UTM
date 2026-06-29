-- ============================================
-- Migration 016: Add 'manager' role back to user_role enum
-- ============================================
-- Re-introduces the 'manager' role for rank-based access control.
-- Managers can manage cats, emergencies, and volunteers.
-- Only admins can manage users and review donations.

-- Add 'manager' to the enum type
ALTER TABLE users ALTER COLUMN role TYPE TEXT;
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('student', 'volunteer', 'manager', 'admin');
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
