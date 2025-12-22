-- Supabase Schema for CPTracker
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- Profiles Table (User Information)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_public BOOLEAN DEFAULT false,
  avatar_hash TEXT,  -- SHA-256 hash of email for Gravatar
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster username queries
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Anyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ============================================
-- Problems Table
-- ============================================
CREATE TABLE IF NOT EXISTS problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "题目" TEXT NOT NULL,
  "题目名称" TEXT,
  "难度" TEXT NOT NULL,
  "题解" TEXT DEFAULT '',
  "关键词" TEXT DEFAULT '',
  "日期" TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS problems_user_id_idx ON problems(user_id);
CREATE INDEX IF NOT EXISTS problems_date_idx ON problems("日期");

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own problems" ON problems;
DROP POLICY IF EXISTS "Users can insert own problems" ON problems;
DROP POLICY IF EXISTS "Users can update own problems" ON problems;
DROP POLICY IF EXISTS "Users can delete own problems" ON problems;

-- New policies with public access support
-- Anyone can view problems from users with public profiles
CREATE POLICY "Public problems are viewable by everyone" ON problems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = problems.user_id
      AND profiles.is_public = true
    )
  );

-- Users can view their own problems
CREATE POLICY "Users can view own problems" ON problems
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own problems
CREATE POLICY "Users can insert own problems" ON problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own problems
CREATE POLICY "Users can update own problems" ON problems
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own problems
CREATE POLICY "Users can delete own problems" ON problems
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON problems;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON problems
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at (problems)
DROP TRIGGER IF EXISTS update_updated_at_trigger ON problems;
CREATE TRIGGER update_updated_at_trigger
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger to update updated_at (profiles)
DROP TRIGGER IF EXISTS update_updated_at_trigger_profiles ON profiles;
CREATE TRIGGER update_updated_at_trigger_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
