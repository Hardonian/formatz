/*
  Helper Functions & Utility Views
  
  Additional database utilities to simplify common operations and improve
  developer experience. Includes search functions, cleanup utilities, and
  convenience views.
  
  Functions:
  - search_templates(query_text, format_filter): Full-text template search
  - cleanup_expired_data(): Remove old logs and expired keys
  - get_user_dashboard(user_uuid): Complete user dashboard data
  - duplicate_template(template_uuid, new_name): Fork/copy template
  
  Views:
  - active_users_view: Recently active users
  - template_leaderboard: Most popular templates
*/

-- =====================================================
-- VIEW: ACTIVE USERS
-- =====================================================
CREATE OR REPLACE VIEW active_users_view AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.plan_type,
  p.created_at as joined_at,
  MAX(ch.created_at) as last_active_at,
  COUNT(DISTINCT ch.id) as total_conversions,
  COUNT(DISTINCT ct.id) as total_templates
FROM profiles p
LEFT JOIN conversion_history ch ON p.id = ch.user_id
LEFT JOIN conversion_templates ct ON p.id = ct.user_id
WHERE ch.created_at >= now() - interval '30 days'
GROUP BY p.id, p.username, p.full_name, p.plan_type, p.created_at
ORDER BY last_active_at DESC;

-- =====================================================
-- VIEW: TEMPLATE LEADERBOARD
-- =====================================================
CREATE OR REPLACE VIEW template_leaderboard AS
SELECT 
  ct.id,
  ct.name,
  ct.source_format,
  ct.target_format,
  ct.usage_count,
  ct.avg_rating,
  ct.rating_count,
  p.username as owner,
  COUNT(DISTINCT ch.user_id) as unique_users,
  COUNT(DISTINCT ch.id) as total_uses,
  MAX(ch.created_at) as last_used_at
FROM conversion_templates ct
LEFT JOIN profiles p ON ct.user_id = p.id
LEFT JOIN conversion_history ch ON ct.id = ch.template_id
WHERE ct.is_public = true
GROUP BY ct.id, ct.name, ct.source_format, ct.target_format, 
         ct.usage_count, ct.avg_rating, ct.rating_count, p.username
ORDER BY ct.usage_count DESC, total_uses DESC, ct.avg_rating DESC
LIMIT 100;

-- =====================================================
-- FUNCTION: SEARCH TEMPLATES
-- =====================================================
CREATE OR REPLACE FUNCTION search_templates(
  query_text text,
  source_format_filter text DEFAULT NULL,
  target_format_filter text DEFAULT NULL,
  min_rating numeric DEFAULT 0,
  result_limit integer DEFAULT 20
)
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
  relevance real
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
    ts_rank(
      to_tsvector('english', ct.name || ' ' || COALESCE(ct.description, '')),
      plainto_tsquery('english', query_text)
    ) as relevance
  FROM conversion_templates ct
  LEFT JOIN profiles p ON ct.user_id = p.id
  WHERE ct.is_public = true
  AND ct.avg_rating >= min_rating
  AND (source_format_filter IS NULL OR ct.source_format = source_format_filter)
  AND (target_format_filter IS NULL OR ct.target_format = target_format_filter)
  AND (
    ct.name ILIKE '%' || query_text || '%'
    OR ct.description ILIKE '%' || query_text || '%'
    OR to_tsvector('english', ct.name || ' ' || COALESCE(ct.description, '')) @@ plainto_tsquery('english', query_text)
  )
  ORDER BY relevance DESC, ct.avg_rating DESC, ct.usage_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: GET COMPLETE USER DASHBOARD
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_dashboard(user_uuid uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT row_to_json(prof.*)
      FROM (
        SELECT id, username, full_name, avatar_url, plan_type, created_at
        FROM profiles WHERE id = user_uuid
      ) prof
    ),
    'stats', (
      SELECT json_build_object(
        'total_conversions', COUNT(DISTINCT ch.id),
        'successful_conversions', COUNT(DISTINCT ch.id) FILTER (WHERE ch.status = 'completed'),
        'total_templates', COUNT(DISTINCT ct.id),
        'public_templates', COUNT(DISTINCT ct.id) FILTER (WHERE ct.is_public = true),
        'avg_rating', COALESCE(AVG(ct.avg_rating), 0)::numeric(3,2),
        'total_ratings_received', COALESCE(SUM(ct.rating_count), 0)
      )
      FROM profiles p
      LEFT JOIN conversion_templates ct ON p.id = ct.user_id
      LEFT JOIN conversion_history ch ON p.id = ch.user_id
      WHERE p.id = user_uuid
    ),
    'recent_activity', (
      SELECT json_agg(activity.*)
      FROM (
        SELECT 
          'conversion' as type,
          ch.id,
          ch.source_format,
          ch.target_format,
          ch.status,
          ch.created_at
        FROM conversion_history ch
        WHERE ch.user_id = user_uuid
        ORDER BY ch.created_at DESC
        LIMIT 10
      ) activity
    ),
    'favorite_templates', (
      SELECT json_agg(templates.*)
      FROM (
        SELECT id, name, source_format, target_format, usage_count
        FROM conversion_templates
        WHERE user_id = user_uuid AND is_favorite = true
        ORDER BY usage_count DESC
        LIMIT 5
      ) templates
    ),
    'api_keys', (
      SELECT json_agg(keys.*)
      FROM (
        SELECT id, name, key_prefix, is_active, last_used_at, expires_at
        FROM api_keys
        WHERE user_id = user_uuid AND is_active = true
        ORDER BY created_at DESC
      ) keys
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: DUPLICATE/FORK TEMPLATE
-- =====================================================
CREATE OR REPLACE FUNCTION duplicate_template(
  template_uuid uuid,
  new_owner_uuid uuid,
  new_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
  original_template record;
BEGIN
  SELECT * INTO original_template
  FROM conversion_templates
  WHERE id = template_uuid
  AND (is_public = true OR user_id = new_owner_uuid);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or not accessible';
  END IF;
  
  INSERT INTO conversion_templates (
    user_id,
    name,
    description,
    source_format,
    target_format,
    configuration,
    is_public,
    is_favorite
  )
  VALUES (
    new_owner_uuid,
    COALESCE(new_name, original_template.name || ' (Copy)'),
    original_template.description,
    original_template.source_format,
    original_template.target_format,
    original_template.configuration,
    false,
    false
  )
  RETURNING id INTO new_template_id;
  
  IF original_template.is_public THEN
    UPDATE shared_templates
    SET fork_count = fork_count + 1
    WHERE template_id = template_uuid;
  END IF;
  
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: CLEANUP EXPIRED DATA
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS json AS $$
DECLARE
  deleted_keys integer;
  deleted_logs integer;
  archived_history integer;
  result json;
BEGIN
  DELETE FROM api_keys
  WHERE expires_at IS NOT NULL 
  AND expires_at < now()
  AND is_active = true;
  
  GET DIAGNOSTICS deleted_keys = ROW_COUNT;
  
  DELETE FROM api_usage_logs
  WHERE created_at < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;
  
  UPDATE conversion_history
  SET status = 'archived'
  WHERE created_at < now() - interval '1 year'
  AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS archived_history = ROW_COUNT;
  
  result := json_build_object(
    'deleted_expired_keys', deleted_keys,
    'deleted_old_logs', deleted_logs,
    'archived_old_history', archived_history,
    'cleanup_time', now()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: GET SYSTEM HEALTH
-- =====================================================
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'database', json_build_object(
      'total_users', (SELECT COUNT(*) FROM profiles),
      'active_users_30d', (SELECT COUNT(*) FROM active_users_view),
      'total_templates', (SELECT COUNT(*) FROM conversion_templates),
      'public_templates', (SELECT COUNT(*) FROM conversion_templates WHERE is_public = true),
      'total_conversions', (SELECT COUNT(*) FROM conversion_history),
      'conversions_today', (SELECT COUNT(*) FROM conversion_history WHERE DATE(created_at) = CURRENT_DATE),
      'total_api_keys', (SELECT COUNT(*) FROM api_keys WHERE is_active = true)
    ),
    'performance', json_build_object(
      'avg_conversion_time_ms', (
        SELECT COALESCE(AVG(processing_time_ms), 0)::numeric(10,2)
        FROM conversion_history
        WHERE created_at >= now() - interval '7 days'
        AND status = 'completed'
      ),
      'success_rate', (
        SELECT CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))::numeric(5,2)
        END
        FROM conversion_history
        WHERE created_at >= now() - interval '7 days'
      )
    ),
    'storage', json_build_object(
      'total_input_bytes', (SELECT COALESCE(SUM(input_size_bytes), 0) FROM conversion_history),
      'total_output_bytes', (SELECT COALESCE(SUM(output_size_bytes), 0) FROM conversion_history)
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: BATCH UPDATE TEMPLATE USAGE
-- =====================================================
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE conversion_templates
  SET usage_count = usage_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: AUTO-INCREMENT TEMPLATE USAGE
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL AND NEW.status = 'completed' THEN
    PERFORM increment_template_usage(NEW.template_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_increment_template_usage ON conversion_history;
CREATE TRIGGER auto_increment_template_usage
  AFTER INSERT OR UPDATE OF status ON conversion_history
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL AND NEW.status = 'completed')
  EXECUTE FUNCTION trigger_increment_template_usage();