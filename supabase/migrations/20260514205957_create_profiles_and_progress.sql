/*
  # Create profiles and user_sicha_progress tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, nullable)
      - `created_at` (timestamptz, default now())
    - `user_sicha_progress`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, references auth.users)
      - `sicha_id` (text, not null)
      - `learned` (boolean, not null, default true)
      - `learned_at` (timestamptz, nullable)
      - `updated_at` (timestamptz, default now())
      - unique constraint on (user_id, sicha_id)

  2. Security
    - Enable RLS on both tables
    - Profiles: users can select, insert, update their own row
    - Progress: users can select, insert, update, delete their own rows

  3. Indexes
    - user_sicha_progress(user_id)
    - user_sicha_progress(sicha_id)

  4. Triggers
    - updated_at auto-update trigger on user_sicha_progress
    - Auto-create profile row on new user signup via auth trigger
*/

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. User sicha progress table
CREATE TABLE IF NOT EXISTS user_sicha_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sicha_id text NOT NULL,
  learned boolean NOT NULL DEFAULT true,
  learned_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, sicha_id)
);

ALTER TABLE user_sicha_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON user_sicha_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_sicha_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_sicha_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_sicha_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_user_sicha_progress_user_id
  ON user_sicha_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sicha_progress_sicha_id
  ON user_sicha_progress (sicha_id);

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_sicha_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
