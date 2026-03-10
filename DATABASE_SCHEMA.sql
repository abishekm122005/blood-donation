-- ============================================================
-- Blood Donation App – Complete Database Schema
-- Safe to run multiple times (fully idempotent)
-- Run this in your Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. TABLES
-- ============================================================

-- 2.1 Users / Donors
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  age INTEGER,
  blood_group TEXT CHECK (blood_group IN ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  phone TEXT,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_donor BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Blood Banks
CREATE TABLE IF NOT EXISTS blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  city TEXT,
  available_blood_types TEXT,
  operating_hours TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Donation History
CREATE TABLE IF NOT EXISTS donation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  donation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  blood_bank_id UUID REFERENCES blood_banks(id),
  units_donated INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Blood Inventory
CREATE TABLE IF NOT EXISTS blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  units_available INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Blood Requests (Emergency)
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('O+','O-','A+','A-','B+','B-','AB+','AB-')),
  units_needed INTEGER NOT NULL,
  hospital_name TEXT,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  urgency TEXT CHECK (urgency IN ('low','medium','high','critical')),
  description TEXT,
  status TEXT CHECK (status IN ('open','fulfilled','closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 Blood Donation Camps
CREATE TABLE IF NOT EXISTS donation_camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  organizer_name TEXT,
  organizer_phone TEXT,
  status TEXT CHECK (status IN ('upcoming','ongoing','completed')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Camp Registrations
CREATE TABLE IF NOT EXISTS camp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES donation_camps(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered','attended','cancelled')) DEFAULT 'registered',
  UNIQUE(donor_id, camp_id)
);

-- 2.8 Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('emergency','camp','reminder','request')),
  title TEXT NOT NULL,
  message TEXT,
  blood_request_id UUID REFERENCES blood_requests(id),
  camp_id UUID REFERENCES donation_camps(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.9 Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_request_id UUID REFERENCES blood_requests(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.10 Reviews / Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- 3. INDEXES  (IF NOT EXISTS = safe to re-run)
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group      ON profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_profiles_location          ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available      ON profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_is_donor          ON profiles(is_donor);
CREATE INDEX IF NOT EXISTS idx_profiles_donor_available   ON profiles(is_donor, is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng           ON profiles(latitude, longitude);

-- blood_banks
CREATE INDEX IF NOT EXISTS idx_blood_banks_city           ON blood_banks(city);
CREATE INDEX IF NOT EXISTS idx_blood_banks_lat_lng        ON blood_banks(latitude, longitude);

-- donation_history
CREATE INDEX IF NOT EXISTS idx_donation_history_donor_id  ON donation_history(donor_id);

-- blood_inventory
CREATE INDEX IF NOT EXISTS idx_blood_inventory_bank_id    ON blood_inventory(blood_bank_id);

-- blood_requests
CREATE INDEX IF NOT EXISTS idx_blood_requests_status      ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at  ON blood_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_blood_requests_lat_lng     ON blood_requests(latitude, longitude);

-- donation_camps
CREATE INDEX IF NOT EXISTS idx_donation_camps_status      ON donation_camps(status);
CREATE INDEX IF NOT EXISTS idx_donation_camps_start_date  ON donation_camps(start_date);
CREATE INDEX IF NOT EXISTS idx_donation_camps_lat_lng     ON donation_camps(latitude, longitude);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read      ON notifications(is_read);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id         ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id       ON messages(receiver_id);

-- camp_registrations
CREATE INDEX IF NOT EXISTS idx_camp_reg_donor_id          ON camp_registrations(donor_id);
CREATE INDEX IF NOT EXISTS idx_camp_reg_camp_id           ON camp_registrations(camp_id);


-- ============================================================
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: safely create a trigger only if it does not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at') THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blood_banks_updated_at') THEN
    CREATE TRIGGER trg_blood_banks_updated_at
      BEFORE UPDATE ON blood_banks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blood_requests_updated_at') THEN
    CREATE TRIGGER trg_blood_requests_updated_at
      BEFORE UPDATE ON blood_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_donation_camps_updated_at') THEN
    CREATE TRIGGER trg_donation_camps_updated_at
      BEFORE UPDATE ON donation_camps
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blood_inventory_updated_at') THEN
    CREATE TRIGGER trg_blood_inventory_updated_at
      BEFORE UPDATE ON blood_inventory
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================================
-- 5. ROW LEVEL SECURITY  (enable on every table)
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_banks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_camps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS POLICIES  (drop first, then create = always safe)
-- ============================================================

-- -------- PROFILES --------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON profiles;
DROP POLICY IF EXISTS "Users can read own profile"                ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"              ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile"              ON profiles;

CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- -------- BLOOD BANKS (public read) --------
DROP POLICY IF EXISTS "Anyone can read blood banks"               ON blood_banks;
DROP POLICY IF EXISTS "Authenticated users can read blood banks"  ON blood_banks;

CREATE POLICY "Anyone can read blood banks"
  ON blood_banks FOR SELECT
  USING (true);


-- -------- DONATION HISTORY --------
DROP POLICY IF EXISTS "Users can read own donation history" ON donation_history;
DROP POLICY IF EXISTS "Users can insert donation history"   ON donation_history;

CREATE POLICY "Users can read own donation history"
  ON donation_history FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can insert donation history"
  ON donation_history FOR INSERT
  WITH CHECK (auth.uid() = donor_id);


-- -------- BLOOD INVENTORY (public read) --------
DROP POLICY IF EXISTS "Anyone can read blood inventory"               ON blood_inventory;
DROP POLICY IF EXISTS "Authenticated users can read blood inventory"  ON blood_inventory;

CREATE POLICY "Anyone can read blood inventory"
  ON blood_inventory FOR SELECT
  USING (true);


-- -------- BLOOD REQUESTS --------
DROP POLICY IF EXISTS "Authenticated users can read blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create blood requests"            ON blood_requests;
DROP POLICY IF EXISTS "Users can update own blood requests"        ON blood_requests;

CREATE POLICY "Authenticated users can read blood requests"
  ON blood_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create blood requests"
  ON blood_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own blood requests"
  ON blood_requests FOR UPDATE
  USING (auth.uid() = requester_id);


-- -------- DONATION CAMPS (public read) --------
DROP POLICY IF EXISTS "Anyone can read donation camps"               ON donation_camps;
DROP POLICY IF EXISTS "Authenticated users can read donation camps"  ON donation_camps;

CREATE POLICY "Anyone can read donation camps"
  ON donation_camps FOR SELECT
  USING (true);


-- -------- CAMP REGISTRATIONS --------
DROP POLICY IF EXISTS "Users can read own camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Users can register for camps"          ON camp_registrations;

CREATE POLICY "Users can read own camp registrations"
  ON camp_registrations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can register for camps"
  ON camp_registrations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);


-- -------- NOTIFICATIONS --------
DROP POLICY IF EXISTS "Users can read own notifications"  ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- -------- MESSAGES --------
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages"     ON messages;

CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);


-- -------- REVIEWS --------
DROP POLICY IF EXISTS "Authenticated users can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews"             ON reviews;

CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = requester_id);


-- ============================================================
-- 7. VERIFICATION  (run manually to check everything is set)
-- ============================================================
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles','blood_banks','donation_history','blood_inventory',
--     'blood_requests','donation_camps','camp_registrations',
--     'notifications','messages','reviews'
--   );
-- All rows should show rowsecurity = true


-- ============================================================
-- RLS Policies Migration for BloodConnect
-- Safe to run multiple times (fully idempotent)
-- Run this in your Supabase SQL Editor
-- ============================================================


-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_banks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_camps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. PROFILES
-- ============================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON profiles;
DROP POLICY IF EXISTS "Users can read own profile"                ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"              ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile"              ON profiles;

CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- 3. BLOOD BANKS  (public read)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read blood banks"               ON blood_banks;
DROP POLICY IF EXISTS "Authenticated users can read blood banks"  ON blood_banks;

CREATE POLICY "Anyone can read blood banks"
  ON blood_banks FOR SELECT
  USING (true);


-- ============================================================
-- 4. DONATION HISTORY
-- ============================================================

DROP POLICY IF EXISTS "Users can read own donation history" ON donation_history;
DROP POLICY IF EXISTS "Users can insert donation history"   ON donation_history;

CREATE POLICY "Users can read own donation history"
  ON donation_history FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can insert donation history"
  ON donation_history FOR INSERT
  WITH CHECK (auth.uid() = donor_id);


-- ============================================================
-- 5. BLOOD INVENTORY  (public read)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read blood inventory"               ON blood_inventory;
DROP POLICY IF EXISTS "Authenticated users can read blood inventory"  ON blood_inventory;

CREATE POLICY "Anyone can read blood inventory"
  ON blood_inventory FOR SELECT
  USING (true);


-- ============================================================
-- 6. BLOOD REQUESTS
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create blood requests"            ON blood_requests;
DROP POLICY IF EXISTS "Users can update own blood requests"        ON blood_requests;

CREATE POLICY "Authenticated users can read blood requests"
  ON blood_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create blood requests"
  ON blood_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own blood requests"
  ON blood_requests FOR UPDATE
  USING (auth.uid() = requester_id);


-- ============================================================
-- 7. DONATION CAMPS  (public read)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read donation camps"               ON donation_camps;
DROP POLICY IF EXISTS "Authenticated users can read donation camps"  ON donation_camps;

CREATE POLICY "Anyone can read donation camps"
  ON donation_camps FOR SELECT
  USING (true);


-- ============================================================
-- 8. CAMP REGISTRATIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can read own camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Users can register for camps"          ON camp_registrations;

CREATE POLICY "Users can read own camp registrations"
  ON camp_registrations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can register for camps"
  ON camp_registrations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);


-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "Users can read own notifications"   ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications"  ON notifications;
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- 10. MESSAGES
-- ============================================================

DROP POLICY IF EXISTS "Users can read own messages"                ON messages;
DROP POLICY IF EXISTS "Users can send messages"                    ON messages;
DROP POLICY IF EXISTS "Users can only see their own messages"      ON messages;

CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);


-- ============================================================
-- 11. REVIEWS
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews"             ON reviews;

CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- ============= VERIFICATION =============

-- Run this query to verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'donation_history', 'blood_requests', 'notifications', 'messages', 'camp_registrations');
-- Should show 't' (true) for all tables
