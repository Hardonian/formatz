/*
  Template Rating & Review System
  
  Enables community feedback on public templates through ratings and reviews.
  Helps users discover high-quality templates and improves template discoverability.
  
  Tables:
  - template_ratings: User ratings and reviews
  
  Columns added to existing tables:
  - conversion_templates.avg_rating
  - conversion_templates.rating_count
  
  Functions:
  - update_template_rating_stats(template_uuid): Recalculate rating aggregates
  - get_template_with_ratings(template_uuid): Get template with rating details
  
  Security:
  - Users can rate templates once
  - Users can update their own ratings
  - Only authenticated users can rate
  - Ratings visible to all authenticated users
*/

-- =====================================================
-- ADD RATING COLUMNS TO CONVERSION TEMPLATES
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversion_templates' AND column_name = 'avg_rating'
  ) THEN
    ALTER TABLE conversion_templates 
    ADD COLUMN avg_rating numeric(3, 2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversion_templates' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE conversion_templates 
    ADD COLUMN rating_count integer DEFAULT 0 CHECK (rating_count >= 0);
  END IF;
END $$;

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_conversion_templates_rating ON conversion_templates(avg_rating DESC, rating_count DESC);

-- =====================================================
-- TEMPLATE RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS template_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES conversion_templates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  is_helpful boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(template_id, user_id)
);

ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_ratings_template_id ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user_id ON template_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_rating ON template_ratings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_template_ratings_created_at ON template_ratings(created_at DESC);

-- =====================================================
-- RLS POLICIES FOR TEMPLATE RATINGS
-- =====================================================

-- Anyone can view ratings for public templates
CREATE POLICY "Users can view ratings for accessible templates"
  ON template_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversion_templates ct
      WHERE ct.id = template_ratings.template_id
      AND (ct.is_public = true OR ct.user_id = auth.uid())
    )
  );

-- Users can insert their own ratings
CREATE POLICY "Users can create their own ratings"
  ON template_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON template_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
  ON template_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: UPDATE TEMPLATE RATING STATS
-- =====================================================
CREATE OR REPLACE FUNCTION update_template_rating_stats(template_uuid uuid)
RETURNS void AS $$
DECLARE
  new_avg numeric(3, 2);
  new_count integer;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0)::numeric(3, 2),
    COUNT(*)::integer
  INTO new_avg, new_count
  FROM template_ratings
  WHERE template_id = template_uuid;
  
  UPDATE conversion_templates
  SET 
    avg_rating = new_avg,
    rating_count = new_count,
    updated_at = now()
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: AUTO-UPDATE RATING STATS
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_update_template_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_template_rating_stats(OLD.template_id);
    RETURN OLD;
  ELSE
    PERFORM update_template_rating_stats(NEW.template_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_rating_stats_trigger ON template_ratings;
CREATE TRIGGER template_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON template_ratings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_template_rating_stats();

-- =====================================================
-- FUNCTION: GET TEMPLATE WITH RATINGS
-- =====================================================
CREATE OR REPLACE FUNCTION get_template_with_ratings(template_uuid uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'template', (
      SELECT row_to_json(t.*)
      FROM (
        SELECT 
          ct.*,
          p.username as owner_username,
          p.avatar_url as owner_avatar
        FROM conversion_templates ct
        LEFT JOIN profiles p ON ct.user_id = p.id
        WHERE ct.id = template_uuid
      ) t
    ),
    'rating_summary', (
      SELECT json_build_object(
        'average_rating', COALESCE(AVG(rating), 0)::numeric(3,2),
        'total_ratings', COUNT(*),
        'rating_distribution', json_build_object(
          '5_stars', COUNT(*) FILTER (WHERE rating = 5),
          '4_stars', COUNT(*) FILTER (WHERE rating = 4),
          '3_stars', COUNT(*) FILTER (WHERE rating = 3),
          '2_stars', COUNT(*) FILTER (WHERE rating = 2),
          '1_star', COUNT(*) FILTER (WHERE rating = 1)
        )
      )
      FROM template_ratings
      WHERE template_id = template_uuid
    ),
    'recent_reviews', (
      SELECT json_agg(row_to_json(reviews.*))
      FROM (
        SELECT 
          tr.id,
          tr.rating,
          tr.review,
          tr.created_at,
          tr.updated_at,
          p.username,
          p.avatar_url
        FROM template_ratings tr
        LEFT JOIN profiles p ON tr.user_id = p.id
        WHERE tr.template_id = template_uuid 
        AND tr.review IS NOT NULL
        ORDER BY tr.created_at DESC
        LIMIT 10
      ) reviews
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: GET TOP RATED TEMPLATES
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_rated_templates(result_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  source_format text,
  target_format text,
  avg_rating numeric,
  rating_count integer,
  usage_count integer,
  owner_username text,
  owner_avatar text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ct.description,
    ct.source_format,
    ct.target_format,
    ct.avg_rating,
    ct.rating_count,
    ct.usage_count,
    p.username as owner_username,
    p.avatar_url as owner_avatar
  FROM conversion_templates ct
  LEFT JOIN profiles p ON ct.user_id = p.id
  WHERE ct.is_public = true
  AND ct.rating_count > 0
  ORDER BY ct.avg_rating DESC, ct.rating_count DESC, ct.usage_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to template_ratings
DROP TRIGGER IF EXISTS update_template_ratings_updated_at ON template_ratings;
CREATE TRIGGER update_template_ratings_updated_at
  BEFORE UPDATE ON template_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();