/*
  # Monetization Infrastructure - Complete Revenue System

  ## Overview
  This migration adds comprehensive monetization features including subscriptions,
  API keys, usage tracking, marketplace, referrals, and analytics.

  ## New Tables
  
  ### 1. Subscriptions
  - Track user subscription plans and billing
  - Integrate with Stripe for payment processing
  - Handle trials, cancellations, and upgrades
  
  ### 2. Usage Stats
  - Monitor user activity and enforce limits
  - Track conversions, API calls, and data processed
  - Monthly rollup for quota management
  
  ### 3. Premium Templates (Marketplace)
  - Allow creators to sell advanced templates
  - Revenue sharing (70/30 split)
  - Purchase tracking and access control
  
  ### 4. Referral System
  - Viral growth mechanism
  - Reward both referrer and referee
  - Track conversion funnel
  
  ### 5. API Keys (Enhanced)
  - Monetized API access
  - Rate limiting by plan tier
  - Usage tracking and quota enforcement
  
  ### 6. Ad Impressions
  - Track ad performance
  - Calculate revenue
  - A/B test different placements

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin-only access for revenue tables
*/

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  
  -- Stripe integration
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  stripe_price_id text,
  
  -- Billing details
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_end timestamptz,
  
  -- Pricing
  amount_cents integer DEFAULT 0,
  currency text DEFAULT 'usd',
  interval text CHECK (interval IN ('month', 'year')),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- USAGE STATS TABLE (Monthly Quotas)
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  
  -- Conversion tracking
  conversion_count integer DEFAULT 0,
  total_input_bytes bigint DEFAULT 0,
  total_output_bytes bigint DEFAULT 0,
  
  -- API tracking
  api_request_count integer DEFAULT 0,
  api_data_transferred bigint DEFAULT 0,
  
  -- Template usage
  templates_created integer DEFAULT 0,
  templates_used integer DEFAULT 0,
  
  -- Limits exceeded
  limit_exceeded_count integer DEFAULT 0,
  upgrade_prompts_shown integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, month)
);

CREATE INDEX idx_usage_stats_user_month ON usage_stats(user_id, month);
CREATE INDEX idx_usage_stats_month ON usage_stats(month);

ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage stats"
  ON usage_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- PREMIUM TEMPLATES (Marketplace)
-- =====================================================
CREATE TABLE IF NOT EXISTS premium_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES conversion_templates(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Pricing
  price_cents integer NOT NULL CHECK (price_cents >= 100), -- Minimum $1
  currency text DEFAULT 'usd',
  commission_pct integer DEFAULT 30 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  
  -- Sales metrics
  sales_count integer DEFAULT 0,
  gross_revenue_cents bigint DEFAULT 0,
  creator_revenue_cents bigint DEFAULT 0,
  
  -- Marketing
  featured boolean DEFAULT false,
  category text,
  tags text[] DEFAULT '{}',
  
  -- Approval workflow
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  rejected_reason text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_premium_templates_template ON premium_templates(template_id);
CREATE INDEX idx_premium_templates_creator ON premium_templates(creator_id);
CREATE INDEX idx_premium_templates_approved ON premium_templates(is_approved) WHERE is_approved = true;
CREATE INDEX idx_premium_templates_category ON premium_templates(category);

ALTER TABLE premium_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved premium templates"
  ON premium_templates FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Creators can view own premium templates"
  ON premium_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create premium templates"
  ON premium_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own premium templates"
  ON premium_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- =====================================================
-- TEMPLATE PURCHASES
-- =====================================================
CREATE TABLE IF NOT EXISTS template_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  premium_template_id uuid REFERENCES premium_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment details
  price_paid_cents integer NOT NULL,
  commission_cents integer NOT NULL,
  creator_payout_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  
  -- Stripe
  stripe_payment_intent_id text,
  stripe_charge_id text,
  
  purchased_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, premium_template_id)
);

CREATE INDEX idx_template_purchases_user ON template_purchases(user_id);
CREATE INDEX idx_template_purchases_template ON template_purchases(premium_template_id);
CREATE INDEX idx_template_purchases_date ON template_purchases(purchased_at);

ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own template purchases"
  ON template_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- REFERRALS SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code text UNIQUE NOT NULL,
  
  -- Referee tracking
  referred_email text,
  referred_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'expired')),
  converted_at timestamptz,
  
  -- Rewards
  referrer_reward_cents integer DEFAULT 0,
  referee_reward_cents integer DEFAULT 0,
  reward_applied boolean DEFAULT false,
  
  -- Metadata
  utm_source text,
  utm_campaign text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

-- =====================================================
-- API KEYS (Enhanced for Monetization)
-- =====================================================
-- Add new columns to existing api_keys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys' AND column_name = 'plan_tier'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN plan_tier text DEFAULT 'free' CHECK (plan_tier IN ('free', 'developer', 'business', 'enterprise'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys' AND column_name = 'monthly_quota'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN monthly_quota integer DEFAULT 1000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys' AND column_name = 'requests_this_month'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN requests_this_month integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys' AND column_name = 'quota_reset_at'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN quota_reset_at timestamptz DEFAULT date_trunc('month', now() + interval '1 month');
  END IF;
END $$;

-- =====================================================
-- AD IMPRESSIONS TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ad details
  ad_slot text NOT NULL CHECK (ad_slot IN ('header', 'sidebar', 'footer', 'native', 'mobile')),
  ad_network text NOT NULL CHECK (ad_network IN ('carbon', 'adsense', 'ethical', 'buysellads')),
  ad_size text,
  
  -- Metrics
  impression_count integer DEFAULT 1,
  viewable_impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  
  -- Revenue (estimated)
  estimated_cpm numeric(10,2) DEFAULT 5.00,
  estimated_revenue_cents integer DEFAULT 0,
  
  -- Context
  page_url text,
  user_agent text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL
);

CREATE INDEX idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_date ON ad_impressions(date);
CREATE INDEX idx_ad_impressions_slot ON ad_impressions(ad_slot);
CREATE INDEX idx_ad_impressions_network ON ad_impressions(ad_network);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert ad impressions (for tracking)
CREATE POLICY "Anyone can log ad impressions"
  ON ad_impressions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- PAYMENT TRANSACTIONS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Transaction details
  type text NOT NULL CHECK (type IN ('subscription', 'template_purchase', 'api_topup', 'refund')),
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- Stripe references
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_invoice_id text,
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  succeeded_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has exceeded usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_plan_type text;
  v_usage_count integer;
  v_limit integer;
BEGIN
  -- Get user's plan
  SELECT plan_type INTO v_plan_type
  FROM profiles
  WHERE id = p_user_id;

  -- Pro and Enterprise have unlimited
  IF v_plan_type IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;

  -- Get usage for current month
  SELECT COALESCE(conversion_count, 0) INTO v_usage_count
  FROM usage_stats
  WHERE user_id = p_user_id
    AND month = date_trunc('month', CURRENT_DATE);

  -- Free tier limit
  v_limit := 50;

  RETURN v_usage_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage stats
CREATE OR REPLACE FUNCTION increment_usage_stats(
  p_user_id uuid,
  p_conversion_count integer DEFAULT 1,
  p_input_bytes bigint DEFAULT 0,
  p_output_bytes bigint DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_stats (
    user_id,
    month,
    conversion_count,
    total_input_bytes,
    total_output_bytes,
    updated_at
  )
  VALUES (
    p_user_id,
    date_trunc('month', CURRENT_DATE),
    p_conversion_count,
    p_input_bytes,
    p_output_bytes,
    now()
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    conversion_count = usage_stats.conversion_count + p_conversion_count,
    total_input_bytes = usage_stats.total_input_bytes + p_input_bytes,
    total_output_bytes = usage_stats.total_output_bytes + p_output_bytes,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character code
    v_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Auto-update subscription status when updated
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- Auto-sync plan_type to profiles when subscription changes
CREATE OR REPLACE FUNCTION sync_plan_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles
    SET plan_type = NEW.plan,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_plan_to_profile
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_plan_to_profile();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Revenue overview
CREATE OR REPLACE VIEW revenue_overview AS
SELECT
  date_trunc('month', created_at) as month,
  type,
  COUNT(*) as transaction_count,
  SUM(amount_cents) / 100.0 as total_revenue,
  AVG(amount_cents) / 100.0 as avg_transaction
FROM payment_transactions
WHERE status = 'succeeded'
GROUP BY date_trunc('month', created_at), type;

-- Active subscriptions summary
CREATE OR REPLACE VIEW active_subscriptions_summary AS
SELECT
  plan,
  COUNT(*) as subscriber_count,
  SUM(amount_cents) / 100.0 as monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY plan;

-- User growth metrics
CREATE OR REPLACE VIEW user_growth_metrics AS
SELECT
  date_trunc('day', created_at) as signup_date,
  plan_type,
  COUNT(*) as signups
FROM profiles
GROUP BY date_trunc('day', created_at), plan_type
ORDER BY signup_date DESC;
