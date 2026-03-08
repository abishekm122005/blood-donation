-- RLS Policies Migration for BloodConnect
-- Run this in your Supabase SQL Editor to apply Row Level Security
-- This file only adds RLS policies without recreating tables

-- ============= ENABLE RLS ON TABLES =============

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camp_registrations ENABLE ROW LEVEL SECURITY;

-- ============= DROP EXISTING POLICIES (if any) =============

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can only see their own messages" ON messages;

-- ============= PROFILES TABLE POLICIES =============

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============= DONATION HISTORY POLICIES =============

DROP POLICY IF EXISTS "Users can read own donation history" ON donation_history;
DROP POLICY IF EXISTS "Users can insert donation history" ON donation_history;

CREATE POLICY "Users can read own donation history"
  ON donation_history FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can insert donation history"
  ON donation_history FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- ============= BLOOD REQUESTS POLICIES =============

DROP POLICY IF EXISTS "Authenticated users can read blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can update own blood requests" ON blood_requests;

CREATE POLICY "Authenticated users can read blood requests"
  ON blood_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create blood requests"
  ON blood_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own blood requests"
  ON blood_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- ============= NOTIFICATIONS POLICIES =============

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ============= MESSAGES POLICIES =============

DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============= CAMP REGISTRATIONS POLICIES =============

DROP POLICY IF EXISTS "Users can read own camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Users can register for camps" ON camp_registrations;

CREATE POLICY "Users can read own camp registrations"
  ON camp_registrations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can register for camps"
  ON camp_registrations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- ============= VERIFICATION =============

-- Run this query to verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'donation_history', 'blood_requests', 'notifications', 'messages', 'camp_registrations');
-- Should show 't' (true) for all tables
