/**
 * Profile Service
 *
 * Manages user profiles and preferences.
 * Handles CRUD operations for user-related data.
 */

import { BaseService } from '../base.service';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database/schema';
import type {
  ServiceResponse,
  UserProfile,
  UserPreferences,
  UpdateProfileDTO,
  UpdatePreferencesDTO,
} from '../../types/dtos';

export class ProfileService extends BaseService {
  constructor() {
    super('ProfileService');
  }

  /**
   * Get user profile
   */
  async getProfile(userId?: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeOperation(async () => {
      const targetUserId = userId || await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');

      return this.mapToUserProfile(data);
    }, 'Failed to fetch profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileDTO): Promise<ServiceResponse<UserProfile>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const updateData: Partial<Database['public']['Tables']['profiles']['Update']> = {
        username: updates.username,
        full_name: updates.fullName,
        avatar_url: updates.avatarUrl,
      };

      const { data, error} = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Profile update failed');

      return this.mapToUserProfile(data);
    }, 'Failed to update profile');
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId?: string): Promise<ServiceResponse<UserPreferences>> {
    return this.executeOperation(async () => {
      const targetUserId = userId || await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Preferences not found');

      return this.mapToUserPreferences(data);
    }, 'Failed to fetch preferences');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(updates: UpdatePreferencesDTO): Promise<ServiceResponse<UserPreferences>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const updateData: Partial<Database['public']['Tables']['user_preferences']['Update']> = {
        theme: updates.theme,
        default_source_format: updates.defaultSourceFormat,
        default_target_format: updates.defaultTargetFormat,
        auto_save_history: updates.autoSaveHistory,
        max_file_size_mb: updates.maxFileSizeMb,
        preferences: updates.customPreferences,
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updateData as any)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Preferences update failed');

      return this.mapToUserPreferences(data);
    }, 'Failed to update preferences');
  }

  /**
   * Get complete user dashboard data
   */
  async getDashboard(userId?: string): Promise<ServiceResponse<any>> {
    return this.executeOperation(async () => {
      const targetUserId = userId || await this.getCurrentUserId();

      const { data, error } = await supabase
        .rpc('get_user_dashboard', { user_uuid: targetUserId } as any);

      if (error) throw error;
      return data;
    }, 'Failed to fetch dashboard');
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      return !data;
    }, 'Failed to check username availability');
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      planType: data.plan_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToUserPreferences(data: any): UserPreferences {
    return {
      userId: data.user_id,
      theme: data.theme,
      defaultSourceFormat: data.default_source_format,
      defaultTargetFormat: data.default_target_format,
      autoSaveHistory: data.auto_save_history,
      maxFileSizeMb: data.max_file_size_mb,
      customPreferences: data.preferences || {},
    };
  }
}

// Export singleton instance
export const profileService = new ProfileService();
