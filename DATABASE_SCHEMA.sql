-- Blood Donation App Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Users/Donors Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  age INTEGER,
  blood_group TEXT CHECK (blood_group IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  phone TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_donor BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Blood Banks Table
CREATE TABLE IF NOT EXISTS blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  available_blood_types TEXT, -- JSON or comma-separated
  operating_hours TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Donation History
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

-- 4. Blood Inventory
CREATE TABLE IF NOT EXISTS blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  units_available INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blood Requests (Emergency)
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
  units_needed INTEGER NOT NULL,
  hospital_name TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  status TEXT CHECK (status IN ('open', 'fulfilled', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Blood Donation Camps
CREATE TABLE IF NOT EXISTS donation_camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  organizer_name TEXT,
  organizer_phone TEXT,
  status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Camp Registrations
CREATE TABLE IF NOT EXISTS camp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES donation_camps(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered', 'attended', 'cancelled')) DEFAULT 'registered',
  UNIQUE(donor_id, camp_id)
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('emergency', 'camp', 'reminder', 'request')),
  title TEXT NOT NULL,
  message TEXT,
  blood_request_id UUID REFERENCES blood_requests(id),
  camp_id UUID REFERENCES donation_camps(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Messages (for communication between donors and requesters)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_request_id UUID REFERENCES blood_requests(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Reviews/Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group ON profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_donation_history_donor_id ON donation_history(donor_id);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_blood_bank_id ON blood_inventory(blood_bank_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_requests_created_at ON blood_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_donation_camps_status ON donation_camps(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- ============= ENABLE RLS ON TABLES =============

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camp_registrations ENABLE ROW LEVEL SECURITY;

-- ============= DROP EXISTING POLICIES (if any - for re-running) =============

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own donation history" ON donation_history;
DROP POLICY IF EXISTS "Users can insert donation history" ON donation_history;
DROP POLICY IF EXISTS "Authenticated users can read blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can create blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can update own blood requests" ON blood_requests;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can read own camp registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Users can register for camps" ON camp_registrations;

-- ============= CREATE NEW POLICIES =============

-- ============= PROFILES TABLE POLICIES =============

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Authenticated users can read all profiles (for donor search)
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============= DONATION HISTORY POLICIES =============

-- Users can read their own donation history
CREATE POLICY "Users can read own donation history"
  ON donation_history FOR SELECT
  USING (auth.uid() = donor_id);

-- Users can insert their own donation history
CREATE POLICY "Users can insert donation history"
  ON donation_history FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- ============= BLOOD REQUESTS POLICIES =============

-- Users can read blood requests (public for visibility)
CREATE POLICY "Authenticated users can read blood requests"
  ON blood_requests FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create blood requests
CREATE POLICY "Users can create blood requests"
  ON blood_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update their own blood requests
CREATE POLICY "Users can update own blood requests"
  ON blood_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- ============= NOTIFICATIONS POLICIES =============

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ============= MESSAGES POLICIES =============

-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============= CAMP REGISTRATIONS POLICIES =============

-- Users can read their own camp registrations
CREATE POLICY "Users can read own camp registrations"
  ON camp_registrations FOR SELECT
  USING (auth.uid() = donor_id);

-- Users can register for camps
CREATE POLICY "Users can register for camps"
  ON camp_registrations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- ============= VERIFICATION QUERY =============

-- Run this query to verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename IN ('profiles', 'donation_history', 'blood_requests', 'notifications', 'messages', 'camp_registrations');
-- Should show 't' (true) for all tables
