-- ============================================
-- CatCare UTM — Development Seed Data
-- ============================================
-- WARNING: This file is for DEVELOPMENT use only.
-- Do NOT run this against a production database.
-- Add this file to .gitignore in production.
-- ============================================
-- IMPORTANT: Change these passwords before deploying to production!
-- ============================================

-- ─── Seed Users ───
-- Default password for all accounts below: password123
-- IMPORTANT: Change the admin password immediately in production!
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'admin'),
  ('Student User', 'student@graduate.utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'student');

INSERT INTO cats (nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id) VALUES
  ('Oyen Library', 'Friendly orange cat usually seen near the library.', 'https://placecats.com/millie/400/300', 'UTM Library', 1.5589000, 103.6389000, 'healthy', 'campus_managed', 2),
  ('Grey Canteen', 'Shy grey cat often near the cafeteria.', 'https://placecats.com/millie/400/300', 'UTM Cafeteria', 1.5600000, 103.6400000, 'needs_attention', 'stray', 2),
  ('Kucing Tepi Jalan', 'Black and white cat that hangs around the main road.', 'https://placecats.com/millie/400/300', 'UTM Main Road', 1.5595000, 103.6395000, 'healthy', 'stray', 2),
  ('Milo Dorm', 'Tabby cat adopted by students at the dormitory.', 'https://placecats.com/millie/400/300', 'UTM Dormitory Block A', 1.5610000, 103.6410000, 'healthy', 'adopted', 2),
  ('Putih Engineering', 'White cat with blue eyes near the engineering faculty.', 'https://placecats.com/millie/400/300', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 'injured', 'campus_managed', 2),
  ('Shadow Parking', 'Dark grey cat that lives in the parking area.', 'https://placecats.com/millie/400/300', 'UTM Parking Lot B', 1.5605000, 103.6405000, 'healthy', 'stray', 2),
  ('Ginger Mosque', 'Orange cat always sleeping near the mosque.', 'https://placecats.com/millie/400/300', 'UTM Mosque', 1.5598000, 103.6392000, 'needs_attention', 'campus_managed', 2),
  ('Bulat Sports', 'Round fluffy cat near the sports complex.', 'https://placecats.com/millie/400/300', 'UTM Sports Complex', 1.5602000, 103.6398000, 'healthy', 'stray', 2);

INSERT INTO emergency_reports (cat_id, title, description, emergency_type, priority, status, location_name, latitude, longitude, reported_by_user_id) VALUES
  (1, 'Injured cat near cafeteria', 'Cat appears to have an injured leg and needs urgent help.', 'injury', 'critical', 'open', 'UTM Cafeteria', 1.5600000, 103.6400000, 2),
  (2, 'Cat missing near dorm', 'Grey cat missing since last night, last seen near dorm entrance.', 'missing', 'high', 'in_progress', 'UTM Dorm Entrance', 1.5590000, 103.6370000, 2),
  (5, 'Injured white cat at engineering', 'The white cat near engineering faculty seems to have a cut on its paw.', 'injury', 'high', 'open', 'UTM Engineering Faculty', 1.5590000, 103.6380000, 2),
  (7, 'Ginger cat not eating', 'The orange cat near the mosque has not been eating for 2 days.', 'sickness', 'medium', 'open', 'UTM Mosque', 1.5598000, 103.6392000, 2),
  (NULL, 'Stray kitten at parking lot', 'Found a small kitten alone at the parking lot, looks very young.', 'danger', 'critical', 'open', 'UTM Parking Lot B', 1.5605000, 103.6405000, 2),
  (3, 'Kucing Tepi Jalan needs food', 'The black and white cat near main road seems underweight.', 'feeding_urgent', 'medium', 'resolved', 'UTM Main Road', 1.5595000, 103.6395000, 2);

-- ─── Sample Donations ───
INSERT INTO donations (donor_name, donor_email, amount, receipt_url, note, status, rejection_reason, donor_user_id, reviewed_by_user_id, reviewed_at) VALUES
  ('Ahmad Razak', 'ahmad@graduate.utm.my', 50.00, NULL, 'Monthly contribution for cat food', 'pending', NULL, 2, NULL, NULL),
  ('Siti Nurhaliza', 'siti@graduate.utm.my', 200.00, 'https://example.com/receipts/r002.pdf', 'For veterinary expenses', 'approved', NULL, 2, 1, NOW() - INTERVAL '2 days'),
  ('Lim Wei Jie', 'limwj@graduate.utm.my', 100.00, 'https://example.com/receipts/r003.pdf', 'General donation', 'reviewed', NULL, NULL, 1, NOW() - INTERVAL '1 day'),
  ('Nur Aisyah', 'aisyah@graduate.utm.my', 30.00, NULL, 'For shelter supplies', 'rejected', 'Receipt could not be verified. Please resubmit with a clearer image.', 2, 1, NOW() - INTERVAL '3 days'),
  ('Tan Kok Meng', 'tankm@graduate.utm.my', 500.00, 'https://example.com/receipts/r005.pdf', 'Sponsorship for campus cat program', 'approved', NULL, NULL, 1, NOW() - INTERVAL '5 days');

-- ─── Sample Care History ───
INSERT INTO care_history (cat_id, care_type, description, performed_by, performed_by_user_id) VALUES
  (1, 'feeding', 'Fed Oyen Library with wet food and fresh water near the library entrance.', 'Admin User', 1),
  (5, 'medical', 'Applied antiseptic and bandaged the injured paw of Putih Engineering.', 'Admin User', 1),
  (4, 'grooming', 'Brushed and cleaned Milo Dorm at the dormitory. Removed ticks.', 'Student User', 2),
  (7, 'feeding', 'Provided special appetite-stimulating food for Ginger Mosque.', 'Student User', 2);
