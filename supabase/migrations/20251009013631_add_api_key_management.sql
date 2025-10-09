/*
  API Key Management System
  
  Enables programmatic access to the platform through API keys with rate limiting
  and quota tracking. Supports different access levels based on user plan types.
  
  Tables:
  - api_keys: API key credentials and metadata
  - api_usage_logs: Track API requests for rate limiting and billing
  - api_quota_limits: Define limits per plan type
  
  Functions:
  - generate_api_key(): Create secure random API key
  - validate_api_key(key_string): Verify and return key details
  - check_rate_limit(key_uuid): Verify key hasn't exceeded limits
  - log_api_usage(key_uuid, endpoint, status_code): Track API calls
  - get_api_usage_stats(key_uuid, days_back): Usage statistics
  
  Security:
  - API keys hashed before storage
  - Users can only manage their own keys
  - Rate limiting per plan type
  - Automatic key expiration
*/

-- =====================================================
-- API QUOTA LIMITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_quota_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text UNIQUE NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  requests_per_minute integer NOT NULL DEFAULT 10,
  requests_per_hour integer NOT NULL DEFAULT 100,
  requests_per_day integer NOT NULL DEFAULT 1000,
  requests_per_month integer NOT NULL DEFAULT 10000,
  max_file_size_mb integer NOT NULL DEFAULT 10,
  concurrent_requests integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE api_quota_limits ENABLE ROW LEVEL SECURITY;

-- Insert default quota limits
INSERT INTO api_quota_limits (plan_type, requests_per_minute, requests_per_hour, requests_per_day, requests_per_month, max_file_size_mb, concurrent_requests)
VALUES 
  ('free', 10, 100, 1000, 10000, 10, 1),
  ('pro', 60, 1000, 10000, 100000, 50, 5),
  ('enterprise', 300, 10000, 100000, 1000000, 500, 20)
ON CONFLICT (plan_type) DO NOTHING;

-- =====================================================
-- API KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- API USAGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer,
  request_size_bytes integer DEFAULT 0,
  response_size_bytes integer DEFAULT 0,
  ip_address inet,
  user_agent text,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for rate limiting and analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_key_time ON api_usage_logs(api_key_id, created_at DESC);

-- Partition by month for better performance (optional, commented for now)
-- CREATE TABLE api_usage_logs_y2025m10 PARTITION OF api_usage_logs
-- FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- =====================================================
-- RLS POLICIES FOR API TABLES
-- =====================================================

-- API Quota Limits - All authenticated users can view
CREATE POLICY "Authenticated users can view quota limits"
  ON api_quota_limits FOR SELECT
  TO authenticated
  USING (true);

-- API Keys - Users can manage their own keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- API Usage Logs - Users can view their own logs
CREATE POLICY "Users can view own API usage logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: GENERATE API KEY
-- =====================================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := 'dtc_';
  i integer;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: CREATE API KEY FOR USER
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_api_key(
  user_uuid uuid,
  key_name text,
  expires_in_days integer DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  new_key text;
  key_hash_value text;
  key_prefix_value text;
  new_key_id uuid;
  expires_at_value timestamptz;
BEGIN
  new_key := generate_api_key();
  key_prefix_value := substring(new_key from 1 for 10);
  key_hash_value := encode(digest(new_key, 'sha256'), 'hex');
  
  IF expires_in_days IS NOT NULL THEN
    expires_at_value := now() + (expires_in_days || ' days')::interval;
  END IF;
  
  INSERT INTO api_keys (user_id, name, key_prefix, key_hash, expires_at)
  VALUES (user_uuid, key_name, key_prefix_value, key_hash_value, expires_at_value)
  RETURNING id INTO new_key_id;
  
  RETURN json_build_object(
    'id', new_key_id,
    'key', new_key,
    'prefix', key_prefix_value,
    'expires_at', expires_at_value,
    'warning', 'Save this key securely. It will not be shown again.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: VALIDATE API KEY
-- =====================================================
CREATE OR REPLACE FUNCTION validate_api_key(key_string text)
RETURNS json AS $$
DECLARE
  key_hash_value text;
  result json;
BEGIN
  key_hash_value := encode(digest(key_string, 'sha256'), 'hex');
  
  SELECT json_build_object(
    'valid', CASE WHEN ak.id IS NOT NULL THEN true ELSE false END,
    'key_id', ak.id,
    'user_id', ak.user_id,
    'is_active', ak.is_active,
    'expired', CASE WHEN ak.expires_at IS NOT NULL AND ak.expires_at < now() THEN true ELSE false END,
    'plan_type', p.plan_type
  )
  INTO result
  FROM api_keys ak
  LEFT JOIN profiles p ON ak.user_id = p.id
  WHERE ak.key_hash = key_hash_value
  AND ak.is_active = true
  AND (ak.expires_at IS NULL OR ak.expires_at > now());
  
  IF result IS NULL THEN
    result := json_build_object('valid', false);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: CHECK RATE LIMIT
-- =====================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  key_uuid uuid,
  user_plan text DEFAULT 'free'
)
RETURNS json AS $$
DECLARE
  limits record;
  usage_minute integer;
  usage_hour integer;
  usage_day integer;
  usage_month integer;
  result json;
BEGIN
  SELECT * INTO limits FROM api_quota_limits WHERE plan_type = user_plan;
  
  SELECT COUNT(*) INTO usage_minute
  FROM api_usage_logs
  WHERE api_key_id = key_uuid
  AND created_at >= now() - interval '1 minute';
  
  SELECT COUNT(*) INTO usage_hour
  FROM api_usage_logs
  WHERE api_key_id = key_uuid
  AND created_at >= now() - interval '1 hour';
  
  SELECT COUNT(*) INTO usage_day
  FROM api_usage_logs
  WHERE api_key_id = key_uuid
  AND created_at >= now() - interval '1 day';
  
  SELECT COUNT(*) INTO usage_month
  FROM api_usage_logs
  WHERE api_key_id = key_uuid
  AND created_at >= now() - interval '30 days';
  
  result := json_build_object(
    'allowed', (
      usage_minute < limits.requests_per_minute AND
      usage_hour < limits.requests_per_hour AND
      usage_day < limits.requests_per_day AND
      usage_month < limits.requests_per_month
    ),
    'usage', json_build_object(
      'minute', usage_minute,
      'hour', usage_hour,
      'day', usage_day,
      'month', usage_month
    ),
    'limits', json_build_object(
      'minute', limits.requests_per_minute,
      'hour', limits.requests_per_hour,
      'day', limits.requests_per_day,
      'month', limits.requests_per_month
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: LOG API USAGE
-- =====================================================
CREATE OR REPLACE FUNCTION log_api_usage(
  key_uuid uuid,
  user_uuid uuid,
  endpoint_path text,
  http_method text,
  status_code_value integer,
  response_time integer DEFAULT NULL,
  req_size integer DEFAULT 0,
  res_size integer DEFAULT 0,
  client_ip inet DEFAULT NULL,
  user_agent_string text DEFAULT NULL,
  error_msg text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO api_usage_logs (
    api_key_id,
    user_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    request_size_bytes,
    response_size_bytes,
    ip_address,
    user_agent,
    error_message
  )
  VALUES (
    key_uuid,
    user_uuid,
    endpoint_path,
    http_method,
    status_code_value,
    response_time,
    req_size,
    res_size,
    client_ip,
    user_agent_string,
    error_msg
  )
  RETURNING id INTO log_id;
  
  UPDATE api_keys SET last_used_at = now() WHERE id = key_uuid;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: GET API USAGE STATS
-- =====================================================
CREATE OR REPLACE FUNCTION get_api_usage_stats(
  key_uuid uuid,
  days_back integer DEFAULT 30
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'successful_requests', COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300),
    'failed_requests', COUNT(*) FILTER (WHERE status_code >= 400),
    'avg_response_time_ms', COALESCE(AVG(response_time_ms), 0)::numeric(10,2),
    'total_data_transferred_bytes', SUM(request_size_bytes + response_size_bytes),
    'requests_by_day', (
      SELECT json_agg(daily_stats)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as requests,
          COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful,
          AVG(response_time_ms)::numeric(10,2) as avg_response_time
        FROM api_usage_logs
        WHERE api_key_id = key_uuid
        AND created_at >= now() - (days_back || ' days')::interval
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
      ) daily_stats
    ),
    'top_endpoints', (
      SELECT json_agg(endpoint_stats)
      FROM (
        SELECT 
          endpoint,
          COUNT(*) as requests,
          AVG(response_time_ms)::numeric(10,2) as avg_response_time
        FROM api_usage_logs
        WHERE api_key_id = key_uuid
        AND created_at >= now() - (days_back || ' days')::interval
        GROUP BY endpoint
        ORDER BY requests DESC
        LIMIT 10
      ) endpoint_stats
    )
  )
  INTO result
  FROM api_usage_logs
  WHERE api_key_id = key_uuid
  AND created_at >= now() - (days_back || ' days')::interval;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_quota_limits_updated_at ON api_quota_limits;
CREATE TRIGGER update_api_quota_limits_updated_at
  BEFORE UPDATE ON api_quota_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();