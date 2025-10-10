import { BaseService } from '../base.service';
import { supabase } from '@/lib/supabase';
import type { ServiceResponse } from '@/types/dtos';

interface UsageStats {
  conversion_count: number;
  api_request_count: number;
  total_input_bytes: number;
  total_output_bytes: number;
  limit_exceeded_count: number;
}

interface UsageLimit {
  conversions: number;
  fileSize: number; // in bytes
  apiRequests: number;
  hasUnlimitedAccess: boolean;
}

export class UsageService extends BaseService {
  constructor() {
    super('UsageService');
  }

  /**
   * Check if user can perform a conversion
   */
  async canConvert(userId: string | null): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      // Anonymous users can always convert (no tracking)
      if (!userId) {
        return true;
      }

      // Get user's plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .maybeSingle();

      // Pro and Enterprise have unlimited
      if (profile?.plan_type === 'pro' || profile?.plan_type === 'enterprise') {
        return true;
      }

      // Check free tier limit
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data as boolean;
    }, 'Failed to check usage limit');
  }

  /**
   * Get usage stats for current month
   */
  async getUsageStats(userId: string): Promise<ServiceResponse<UsageStats>> {
    return this.executeOperation(async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('month', startOfMonth.toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;

      return data || {
        conversion_count: 0,
        api_request_count: 0,
        total_input_bytes: 0,
        total_output_bytes: 0,
        limit_exceeded_count: 0,
      };
    }, 'Failed to get usage stats');
  }

  /**
   * Get usage limits based on plan
   */
  async getUsageLimits(userId: string): Promise<ServiceResponse<UsageLimit>> {
    return this.executeOperation(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .maybeSingle();

      const planType = profile?.plan_type || 'free';

      const limits: Record<string, UsageLimit> = {
        free: {
          conversions: 50,
          fileSize: 1 * 1024 * 1024, // 1MB
          apiRequests: 0,
          hasUnlimitedAccess: false,
        },
        pro: {
          conversions: -1, // Unlimited
          fileSize: 10 * 1024 * 1024, // 10MB
          apiRequests: 1000,
          hasUnlimitedAccess: true,
        },
        enterprise: {
          conversions: -1, // Unlimited
          fileSize: 100 * 1024 * 1024, // 100MB
          apiRequests: 50000,
          hasUnlimitedAccess: true,
        },
      };

      return limits[planType];
    }, 'Failed to get usage limits');
  }

  /**
   * Track a conversion
   */
  async trackConversion(
    userId: string | null,
    inputSize: number,
    outputSize: number
  ): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      if (!userId) return; // Don't track anonymous users

      const { error } = await supabase.rpc('increment_usage_stats', {
        p_user_id: userId,
        p_conversion_count: 1,
        p_input_bytes: inputSize,
        p_output_bytes: outputSize,
      });

      if (error) throw error;
    }, 'Failed to track conversion');
  }

  /**
   * Get usage percentage for display
   */
  async getUsagePercentage(userId: string): Promise<ServiceResponse<number>> {
    return this.executeOperation(async () => {
      const [statsResponse, limitsResponse] = await Promise.all([
        this.getUsageStats(userId),
        this.getUsageLimits(userId),
      ]);

      if (!statsResponse.success || !limitsResponse.success) {
        return 0;
      }

      const stats = statsResponse.data!;
      const limits = limitsResponse.data!;

      // Unlimited plans return 0%
      if (limits.hasUnlimitedAccess) {
        return 0;
      }

      const percentage = (stats.conversion_count / limits.conversions) * 100;
      return Math.min(Math.round(percentage), 100);
    }, 'Failed to calculate usage percentage');
  }

  /**
   * Record limit exceeded event
   */
  async recordLimitExceeded(userId: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { error } = await supabase
        .from('usage_stats')
        .upsert({
          user_id: userId,
          month: startOfMonth.toISOString().split('T')[0],
          limit_exceeded_count: 1,
        }, {
          onConflict: 'user_id,month',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    }, 'Failed to record limit exceeded');
  }

  /**
   * Record upgrade prompt shown
   */
  async recordUpgradePromptShown(userId: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { error } = await supabase
        .from('usage_stats')
        .upsert({
          user_id: userId,
          month: startOfMonth.toISOString().split('T')[0],
          upgrade_prompts_shown: 1,
        }, {
          onConflict: 'user_id,month',
          ignoreDuplicates: false,
        });

      if (error) throw error;
    }, 'Failed to record upgrade prompt');
  }
}

export const usageService = new UsageService();
