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
