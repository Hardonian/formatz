/*
  # Enable Anonymous Access for Basic App Features

  ## Overview
  This migration enables anonymous users to use basic conversion features
  while keeping advanced features (history, templates, profiles) behind authentication.

  ## Changes Made
  
  ### 1. Public Template Viewing
  - Add policy for anonymous users to view public templates
  - Allow anyone to browse the public template gallery
  
  ### 2. Shared Templates Access
  - Add policy for anonymous users to view shared templates
  - Enable public sharing of templates via share codes
  
  ### 3. Statistics (Read-Only)
  - Add policy for anonymous users to view format combination stats
  - Add policy for anonymous users to view daily conversion stats
  - Helps users understand popular format conversions

  ## Security Notes
  - Anonymous users CANNOT create, update, or delete data (except conversion logs)
  - Profile, API keys, and user preferences remain fully protected
  - Only read-only access to public/shared data is granted
  - Conversion history for anonymous users has no user_id (ephemeral)
*/

-- Allow anonymous users to view public templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversion_templates' 
    AND policyname = 'Anonymous users can view public templates'
  ) THEN
    CREATE POLICY "Anonymous users can view public templates"
      ON conversion_templates
      FOR SELECT
      TO anon
      USING (is_public = true);
  END IF;
END $$;

-- Allow anonymous users to view shared templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shared_templates' 
    AND policyname = 'Anonymous users can view shared templates'
  ) THEN
    CREATE POLICY "Anonymous users can view shared templates"
      ON shared_templates
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to view format combination stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'format_combination_stats' 
    AND policyname = 'Anonymous users can view format stats'
  ) THEN
    CREATE POLICY "Anonymous users can view format stats"
      ON format_combination_stats
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to view daily conversion stats  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_conversion_stats' 
    AND policyname = 'Anonymous users can view daily stats'
  ) THEN
    CREATE POLICY "Anonymous users can view daily stats"
      ON daily_conversion_stats
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Allow anonymous users to view quota limits (so they know free tier limits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'api_quota_limits' 
    AND policyname = 'Anonymous users can view quota limits'
  ) THEN
    CREATE POLICY "Anonymous users can view quota limits"
      ON api_quota_limits
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
