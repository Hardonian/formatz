/**
 * Template Service
 *
 * Manages conversion templates including CRUD operations,
 * search, sharing, and template discovery.
 */

import { BaseService } from '../base.service';
import { supabase } from '../../lib/supabase';
import type {
  ServiceResponse,
  ConversionTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TemplateSearchParams,
  PaginationParams,
  PaginatedResponse,
} from '../../types/dtos';

export class TemplateService extends BaseService {
  constructor() {
    super('TemplateService');
  }

  /**
   * Create a new template
   */
  async createTemplate(dto: CreateTemplateDTO): Promise<ServiceResponse<ConversionTemplate>> {
    return this.executeOperation(async () => {
      this.validateRequired(dto, ['name', 'sourceFormat', 'targetFormat', 'configuration']);

      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('conversion_templates')
        .insert({
          user_id: userId,
          name: dto.name,
          description: dto.description || null,
          source_format: dto.sourceFormat,
          target_format: dto.targetFormat,
          configuration: dto.configuration,
          is_public: dto.isPublic || false,
          is_favorite: dto.isFavorite || false,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Template creation failed');

      return this.mapToTemplate(data);
    }, 'Failed to create template');
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ServiceResponse<ConversionTemplate>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('conversion_templates')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('id', templateId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Template not found');

      return this.mapToTemplate(data);
    }, 'Failed to fetch template');
  }

  /**
   * Get user's templates
   */
  async getUserTemplates(
    pagination?: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<ConversionTemplate>>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await supabase
        .from('conversion_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get templates
      const { data, error } = await supabase
        .from('conversion_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const templates = data?.map(t => this.mapToTemplate(t)) || [];

      return {
        items: templates,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }, 'Failed to fetch user templates');
  }

  /**
   * Get public templates
   */
  async getPublicTemplates(
    pagination?: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<ConversionTemplate>>> {
    return this.executeOperation(async () => {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await supabase
        .from('conversion_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      // Get templates with owner info
      const { data, error } = await supabase
        .from('conversion_templates')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const templates = data?.map(t => this.mapToTemplate(t)) || [];

      return {
        items: templates,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }, 'Failed to fetch public templates');
  }

  /**
   * Search templates
   */
  async searchTemplates(params: TemplateSearchParams): Promise<ServiceResponse<ConversionTemplate[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase.rpc('search_templates', {
        query_text: params.query,
        source_format_filter: params.sourceFormat,
        target_format_filter: params.targetFormat,
        min_rating: params.minRating || 0,
        result_limit: params.limit || 20,
      });

      if (error) throw error;

      // Map to ConversionTemplate format
      return data?.map((item: any) => ({
        id: item.id,
        userId: '',
        name: item.name,
        description: item.description,
        sourceFormat: item.source_format,
        targetFormat: item.target_format,
        configuration: {},
        isPublic: true,
        isFavorite: false,
        usageCount: item.usage_count,
        avgRating: item.avg_rating,
        ratingCount: item.rating_count,
        createdAt: '',
        updatedAt: '',
        owner: {
          username: item.owner_username,
          avatarUrl: null,
        },
      })) || [];
    }, 'Search failed');
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: UpdateTemplateDTO
  ): Promise<ServiceResponse<ConversionTemplate>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { data, error} = await supabase
        .from('conversion_templates')
        .update({
          name: updates.name,
          description: updates.description,
          configuration: updates.configuration,
          is_public: updates.isPublic,
          is_favorite: updates.isFavorite,
        })
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Template not found or unauthorized');

      return this.mapToTemplate(data);
    }, 'Failed to update template');
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { error } = await supabase
        .from('conversion_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId);

      if (error) throw error;
    }, 'Failed to delete template');
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(templateId: string): Promise<ServiceResponse<ConversionTemplate>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      // Get current status
      const { data: current } = await supabase
        .from('conversion_templates')
        .select('is_favorite')
        .eq('id', templateId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!current) throw new Error('Template not found');

      // Toggle
      const { data, error } = await supabase
        .from('conversion_templates')
        .update({ is_favorite: !current.is_favorite })
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Update failed');

      return this.mapToTemplate(data);
    }, 'Failed to toggle favorite');
  }

  /**
   * Duplicate/fork template
   */
  async duplicateTemplate(
    templateId: string,
    newName?: string
  ): Promise<ServiceResponse<string>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase.rpc('duplicate_template', {
        template_uuid: templateId,
        new_owner_uuid: userId,
        new_name: newName,
      });

      if (error) throw error;
      return data;
    }, 'Failed to duplicate template');
  }

  /**
   * Get top-rated templates
   */
  async getTopRatedTemplates(limit: number = 10): Promise<ServiceResponse<ConversionTemplate[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await supabase
        .from('conversion_templates')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .gt('rating_count', 0)
        .order('avg_rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(t => this.mapToTemplate(t)) || [];
    }, 'Failed to fetch top-rated templates');
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private mapToTemplate(data: any): ConversionTemplate {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      sourceFormat: data.source_format,
      targetFormat: data.target_format,
      configuration: data.configuration,
      isPublic: data.is_public,
      isFavorite: data.is_favorite,
      usageCount: data.usage_count,
      avgRating: data.avg_rating || 0,
      ratingCount: data.rating_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      owner: data.profiles ? {
        username: data.profiles.username,
        avatarUrl: data.profiles.avatar_url,
      } : undefined,
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
