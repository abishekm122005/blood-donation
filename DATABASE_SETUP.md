# Database Setup Guide for BloodConnect

## Important: Row Level Security (RLS) Configuration

After running `DATABASE_SCHEMA.sql`, you need to set up RLS policies in Supabase to allow the app to work properly.

### Navigate to Supabase Dashboard:
1. Go to your project
2. Click on **SQL Editor**
3. Run the following SQL to enable RLS and set policies:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy for authenticated users to insert their profile (for signup)
CREATE POLICY "Authenticated users can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy to allow service role to insert profiles (used by server action)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  USING (current_setting('role') = 'authenticated')
  WITH CHECK (true);

-- Make profiles readable by authenticated users for searching donors
CREATE POLICY "Authenticated users can read all profiles for search"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Testing the App

### Using a Test Email:
Since `thenmuglilanks65@gmail.com` is rate-limited, use a different email for testing:

**Example test email:**
- Email: `testuser2025@example.com` (or any unique email)
- Password: `TestPassword123!`
- Name: Test User
- Age: 25
- Blood Group: O+
- Phone: +1 2345678900
- Location: New York, NY

### What Happens After Registration:
1. User signs up with email/password
2. Profile is created in `profiles` table via server action
3. User can then log in with their credentials

## Environment Variables Needed:

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The `SUPABASE_SERVICE_ROLE_KEY` is needed for the server action to bypass RLS and create profiles during signup.

## Troubleshooting

**If you see "row violates row-level security policy":**
- Make sure you ran the RLS setup SQL above
- Verify the service role key is in `.env.local`
- Restart the Next.js dev server

**If you see "429 Too Many Requests":**
- The email has been rate-limited
- Try with a different email address
- Wait several minutes before retrying the same email

**If profile doesn't load on dashboard:**
- Make sure RLS policies are correctly set up
- Check that the user ID matches between auth and profiles table
- Verify the SELECT policy is working
