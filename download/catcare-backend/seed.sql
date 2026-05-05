USE catcare_utm;

INSERT INTO users (full_name, email, password_hash, role)
VALUES
  ('Admin User', 'admin@utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'admin'),
  ('Student User', 'student@graduate.utm.my', '$2b$12$/XAd2C12mVFLKYpCOK/dO.L0n7FB1w0DVPTP45JkFLGE/Ui7AwBVC', 'student');

INSERT INTO cats (nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id)
VALUES
  ('Oyen Library', 'Friendly orange cat usually seen near the library.', 'https://example.com/cat1.jpg', 'UTM Library', 1.5589000, 103.6389000, 'healthy', 'campus_managed', 2),
  ('Grey Canteen', 'Shy grey cat often near the cafeteria.', 'https://example.com/cat2.jpg', 'UTM Cafeteria', 1.5600000, 103.6400000, 'needs_attention', 'stray', 2);

INSERT INTO emergency_reports (cat_id, title, description, emergency_type, priority, status, location_name, latitude, longitude, reported_by_user_id)
VALUES
  (1, 'Injured cat near cafeteria', 'Cat appears to have an injured leg and needs urgent help.', 'injury', 'critical', 'open', 'UTM Cafeteria', 1.5600000, 103.6400000, 2),
  (2, 'Cat missing near dorm', 'Grey cat missing since last night, last seen near dorm entrance.', 'missing', 'high', 'in_progress', 'UTM Dorm Entrance', 1.5590000, 103.6370000, 2);
