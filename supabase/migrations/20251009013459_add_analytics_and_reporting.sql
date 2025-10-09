/*
  Analytics & Reporting System
  
  Adds comprehensive analytics and reporting capabilities to track conversion patterns,
  user engagement, and system performance.
  
  Tables:
  - daily_conversion_stats: Aggregated daily metrics
  - format_combination_stats: Popular format pairs
  
  Materialized Views:
  - popular_templates_view: Top templates by usage
  - user_activity_summary: Per-user statistics
  
  Functions:
  - update_daily_stats(): Aggregate daily statistics
  - update_format_stats(): Update format combination metrics
  - get_dashboard_stats(user_uuid): Dashboard data
*/

-- =====================================================
-- DAILY CONVERSION STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_conversion_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date date UNIQUE NOT NULL,
  total_conversions integer DEFAULT 0 NOT NULL,
  successful_conversions integer DEFAULT 0 NOT NULL,
  failed_conversions integer DEFAULT 0 NOT NULL,
  unique_users integer DEFAULT 0 NOT NULL,
  total_input_bytes bigint DEFAULT 0 NOT NULL,
  total_output_bytes bigint DEFAULT 0 NOT NULL,
  avg_processing_time_ms numeric(10, 2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE daily_conversion_stats ENABLE ROW LEVEL SECURITY;

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_conversion_stats(stat_date DESC);

-- =====================================================
-- FORMAT COMBINATION STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS format_combination_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_format text NOT NULL,
  target_format text NOT NULL,
  conversion_count integer DEFAULT 0 NOT NULL,
  success_count integer DEFAULT 0 NOT NULL,
  failure_count integer DEFAULT 0 NOT NULL,
  avg_processing_time_ms numeric(10, 2) DEFAULT 0 NOT NULL,
  last_used_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(source_format, target_format)
);

ALTER TABLE format_combination_stats ENABLE ROW LEVEL SECURITY;

-- Indexes for format queries
CREATE INDEX IF NOT EXISTS idx_format_stats_source ON format_combination_stats(source_format);
CREATE INDEX IF NOT EXISTS idx_format_stats_target ON format_combination_stats(target_format);
CREATE INDEX IF NOT EXISTS idx_format_stats_count ON format_combination_stats(conversion_count DESC);

-- =====================================================
-- RLS POLICIES FOR ANALYTICS TABLES
-- =====================================================

-- Daily stats readable by all authenticated users
CREATE POLICY "Authenticated users can view daily stats"
  ON daily_conversion_stats FOR SELECT
  TO authenticated
  USING (true);

-- Format stats readable by all authenticated users
CREATE POLICY "Authenticated users can view format stats"
  ON format_combination_stats FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- MATERIALIZED VIEW: POPULAR TEMPLATES
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_templates_view AS
SELECT 
  ct.id,
  ct.name,
  ct.description,
  ct.source_format,
  ct.target_format,
  ct.usage_count,
  ct.is_public,
  ct.created_at,
  p.username,
  p.avatar_url,
  COUNT(DISTINCT ch.user_id) as unique_users,
  COUNT(ch.id) as total_uses,
  AVG(ch.processing_time_ms)::numeric(10,2) as avg_processing_time
FROM conversion_templates ct
LEFT JOIN profiles p ON ct.user_id = p.id
LEFT JOIN conversion_history ch ON ct.id = ch.template_id
WHERE ct.is_public = true
GROUP BY ct.id, ct.name, ct.description, ct.source_format, ct.target_format, 
         ct.usage_count, ct.is_public, ct.created_at, p.username, p.avatar_url
ORDER BY ct.usage_count DESC, total_uses DESC
LIMIT 100;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_templates_id ON popular_templates_view(id);

-- =====================================================
-- MATERIALIZED VIEW: USER ACTIVITY SUMMARY
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
  p.id as user_id,
  p.username,
  p.full_name,
  p.plan_type,
  COUNT(DISTINCT ct.id) as template_count,
  COUNT(DISTINCT CASE WHEN ct.is_public = true THEN ct.id END) as public_template_count,
  COUNT(DISTINCT ch.id) as total_conversions,
  COUNT(DISTINCT CASE WHEN ch.status = 'completed' THEN ch.id END) as successful_conversions,
  COUNT(DISTINCT CASE WHEN ch.status = 'failed' THEN ch.id END) as failed_conversions,
  SUM(ch.input_size_bytes)::bigint as total_input_bytes,
  SUM(ch.output_size_bytes)::bigint as total_output_bytes,
  AVG(ch.processing_time_ms)::numeric(10,2) as avg_processing_time,
  MAX(ch.created_at) as last_conversion_at,
  p.created_at as user_since
FROM profiles p
LEFT JOIN conversion_templates ct ON p.id = ct.user_id
LEFT JOIN conversion_history ch ON p.id = ch.user_id
GROUP BY p.id, p.username, p.full_name, p.plan_type, p.created_at;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_summary(user_id);

-- =====================================================
-- FUNCTION: UPDATE DAILY STATS
-- =====================================================
CREATE OR REPLACE FUNCTION update_daily_stats(target_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_conversion_stats (
    stat_date,
    total_conversions,
    successful_conversions,
    failed_conversions,
    unique_users,
    total_input_bytes,
    total_output_bytes,
    avg_processing_time_ms
  )
  SELECT 
    target_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(DISTINCT user_id),
    COALESCE(SUM(input_size_bytes), 0),
    COALESCE(SUM(output_size_bytes), 0),
    COALESCE(AVG(processing_time_ms), 0)
  FROM conversion_history
  WHERE DATE(created_at) = target_date
  ON CONFLICT (stat_date) DO UPDATE SET
    total_conversions = EXCLUDED.total_conversions,
    successful_conversions = EXCLUDED.successful_conversions,
    failed_conversions = EXCLUDED.failed_conversions,
    unique_users = EXCLUDED.unique_users,
    total_input_bytes = EXCLUDED.total_input_bytes,
    total_output_bytes = EXCLUDED.total_output_bytes,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: UPDATE FORMAT STATS
-- =====================================================
CREATE OR REPLACE FUNCTION update_format_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO format_combination_stats (
    source_format,
    target_format,
    conversion_count,
    success_count,
    failure_count,
    avg_processing_time_ms,
    last_used_at
  )
  SELECT 
    source_format,
    target_format,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COALESCE(AVG(processing_time_ms), 0),
    MAX(created_at)
  FROM conversion_history
  GROUP BY source_format, target_format
  ON CONFLICT (source_format, target_format) DO UPDATE SET
    conversion_count = EXCLUDED.conversion_count,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    last_used_at = EXCLUDED.last_used_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: GET DASHBOARD STATS
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_stats', (
      SELECT json_build_object(
        'total_conversions', COUNT(*),
        'successful_conversions', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_conversions', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_templates', (SELECT COUNT(*) FROM conversion_templates WHERE user_id = user_uuid),
        'public_templates', (SELECT COUNT(*) FROM conversion_templates WHERE user_id = user_uuid AND is_public = true),
        'avg_processing_time_ms', COALESCE(AVG(processing_time_ms), 0)
      )
      FROM conversion_history
      WHERE user_id = user_uuid
    ),
    'recent_conversions', (
      SELECT json_agg(row_to_json(recent.*))
      FROM (
        SELECT 
          id,
          source_format,
          target_format,
          status,
          processing_time_ms,
          created_at
        FROM conversion_history
        WHERE user_id = user_uuid
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    ),
    'popular_formats', (
      SELECT json_agg(row_to_json(formats.*))
      FROM (
        SELECT 
          source_format,
          target_format,
          COUNT(*) as uses
        FROM conversion_history
        WHERE user_id = user_uuid AND status = 'completed'
        GROUP BY source_format, target_format
        ORDER BY uses DESC
        LIMIT 5
      ) formats
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: REFRESH MATERIALIZED VIEWS
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_templates_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to new tables
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_conversion_stats;
CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON daily_conversion_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_format_stats_updated_at ON format_combination_stats;
CREATE TRIGGER update_format_stats_updated_at
  BEFORE UPDATE ON format_combination_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();