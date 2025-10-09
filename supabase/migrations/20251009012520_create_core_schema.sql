/*
  # DataTextConverter - Core Database Schema

  ## Overview
  This migration creates the foundational database structure for a data/text conversion platform
  that supports multiple format conversions (JSON, XML, CSV, YAML, etc.) with user management,
  conversion templates, history tracking, and sharing capabilities.

  ## 1. New Tables

  ### `profiles`
  User profile information (extends Supabase auth.users)
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique, nullable)
  - `full_name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `plan_type` (text, default 'free') - free, pro, enterprise
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `conversion_templates`
  Saved conversion configurations and presets
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text, required) - Template name
  - `description` (text, nullable)
  - `source_format` (text, required) - json, xml, csv, yaml, etc.
  - `target_format` (text, required) - json, xml, csv, yaml, etc.
  - `configuration` (jsonb, required) - Conversion settings/rules
  - `is_public` (boolean, default false) - Shareable template
  - `is_favorite` (boolean, default false)
  - `usage_count` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `conversion_history`
  Track conversion jobs and results
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, nullable for anonymous)
  - `template_id` (uuid, references conversion_templates, nullable)
  - `source_format` (text, required)
  - `target_format` (text, required)
  - `input_size_bytes` (integer)
  - `output_size_bytes` (integer)
  - `status` (text, default 'pending') - pending, completed, failed
  - `error_message` (text, nullable)
  - `processing_time_ms` (integer, nullable)
  - `created_at` (timestamptz)

  ### `shared_templates`
  Public template gallery and sharing
  - `id` (uuid, primary key)
  - `template_id` (uuid, references conversion_templates)
  - `owner_id` (uuid, references profiles)
  - `share_code` (text, unique) - Unique sharing identifier
  - `view_count` (integer, default 0)
  - `fork_count` (integer, default 0) - How many times copied
  - `created_at` (timestamptz)

  ### `user_preferences`
  Application settings and preferences
  - `user_id` (uuid, primary key, references profiles)
  - `theme` (text, default 'light') - light, dark, auto
  - `default_source_format` (text, default 'json')
  - `default_target_format` (text, default 'xml')
  - `auto_save_history` (boolean, default true)
  - `max_file_size_mb` (integer, default 10)
  - `preferences` (jsonb, default '{}') - Additional custom settings
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can only read/write their own data
  - Public templates are readable by everyone
  - Anonymous conversion history (no user_id) is readable only by creator session

  ## 3. Performance
  - Indexes on user_id foreign keys
  - Indexes on format columns for filtering
  - Indexes on timestamps for sorting
  - GIN index on jsonb configuration column

  ## 4. Data Integrity
  - Cascading deletes for user data cleanup
  - CHECK constraints for valid format types
  - CHECK constraints for valid plan types
  - Default timestamps with automatic updates
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONVERSION TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversion_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  source_format text NOT NULL CHECK (source_format IN ('json', 'xml', 'csv', 'yaml', 'toml', 'txt', 'html', 'markdown')),
  target_format text NOT NULL CHECK (target_format IN ('json', 'xml', 'csv', 'yaml', 'toml', 'txt', 'html', 'markdown')),
  configuration jsonb NOT NULL DEFAULT '{}',
  is_public boolean DEFAULT false NOT NULL,
  is_favorite boolean DEFAULT false NOT NULL,
  usage_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversion_templates ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversion_templates_user_id ON conversion_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_templates_formats ON conversion_templates(source_format, target_format);
CREATE INDEX IF NOT EXISTS idx_conversion_templates_public ON conversion_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_conversion_templates_config ON conversion_templates USING gin(configuration);

-- =====================================================
-- CONVERSION HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversion_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES conversion_templates(id) ON DELETE SET NULL,
  source_format text NOT NULL,
  target_format text NOT NULL,
  input_size_bytes integer DEFAULT 0,
  output_size_bytes integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversion_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversion_history_user_id ON conversion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_history_created_at ON conversion_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_history_status ON conversion_history(status);

-- =====================================================
-- SHARED TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES conversion_templates(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  share_code text UNIQUE NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  fork_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE shared_templates ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_templates_template_id ON shared_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_shared_templates_share_code ON shared_templates(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_templates_owner_id ON shared_templates(owner_id);

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  default_source_format text DEFAULT 'json',
  default_target_format text DEFAULT 'xml',
  auto_save_history boolean DEFAULT true NOT NULL,
  max_file_size_mb integer DEFAULT 10 CHECK (max_file_size_mb > 0),
  preferences jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- CONVERSION TEMPLATES policies
CREATE POLICY "Users can view own templates"
  ON conversion_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates"
  ON conversion_templates FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own templates"
  ON conversion_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON conversion_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON conversion_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CONVERSION HISTORY policies
CREATE POLICY "Users can view own history"
  ON conversion_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON conversion_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON conversion_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous users can insert history (for non-logged-in conversions)
CREATE POLICY "Anonymous users can insert conversion history"
  ON conversion_history FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- SHARED TEMPLATES policies
CREATE POLICY "Anyone can view shared templates"
  ON shared_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own shared templates"
  ON shared_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own shared templates"
  ON shared_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own shared templates"
  ON shared_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- USER PREFERENCES policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversion_templates_updated_at ON conversion_templates;
CREATE TRIGGER update_conversion_templates_updated_at
  BEFORE UPDATE ON conversion_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Also create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;