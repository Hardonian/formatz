/**
 * Conversion Service
 *
 * Core business logic for data format conversions.
 * Handles conversion execution, validation, and history tracking.
 */

import { BaseService } from '../base.service';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database/schema';
import type {
  ServiceResponse,
  ConversionRequest,
  ConversionResult,
  ConversionHistory,
  PaginationParams,
  PaginatedResponse,
} from '../../types/dtos';
import { ConversionEngine } from './conversion.engine';

export class ConversionService extends BaseService {
  private engine: ConversionEngine;
  protected supabase = supabase;

  constructor() {
    super('ConversionService');
    this.engine = new ConversionEngine();
  }

  /**
   * Execute a conversion
   */
  async convert(request: ConversionRequest): Promise<ServiceResponse<ConversionResult>> {
    return this.executeOperation(async () => {
      this.validateRequired(request, ['sourceFormat', 'targetFormat', 'inputData']);

      const startTime = performance.now();
      let userId: string | null = null;

      try {
        userId = await this.getCurrentUserId();
      } catch {
        // Anonymous conversion allowed
      }

      // Validate data size
      if (userId) {
        const preferences = await this.getUserPreferences(userId);
        this.validateDataSize(request.inputData, preferences.maxFileSizeMb);
      } else {
        this.validateDataSize(request.inputData, 10); // 10MB for anonymous
      }

      // Perform conversion
      let result: ConversionResult;
      try {
        const outputData = await this.engine.convert(
          request.inputData,
          request.sourceFormat,
          request.targetFormat,
          request.configuration
        );

        const processingTime = Math.round(performance.now() - startTime);
        const inputSize = new Blob([request.inputData]).size;
        const outputSize = new Blob([outputData]).size;

        result = {
          success: true,
          outputData,
          inputSizeBytes: inputSize,
          outputSizeBytes: outputSize,
          processingTimeMs: processingTime,
        };

        // Save to history
        await this.saveToHistory(userId, request, result, 'completed');

      } catch (error) {
        const processingTime = Math.round(performance.now() - startTime);
        const inputSize = new Blob([request.inputData]).size;

        result = {
          success: false,
          error: error instanceof Error ? error.message : 'Conversion failed',
          inputSizeBytes: inputSize,
          outputSizeBytes: 0,
          processingTimeMs: processingTime,
        };

        // Save failure to history
        await this.saveToHistory(userId, request, result, 'failed', result.error);
      }

      return result;
    }, 'Conversion failed');
  }

  /**
   * Get conversion history
   */
  async getHistory(
    pagination?: PaginationParams
  ): Promise<ServiceResponse<PaginatedResponse<ConversionHistory>>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = (page - 1) * limit;

      // Get total count
      const { count } = await supabase
        .from('conversion_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get history with template info
      const { data, error } = await supabase
        .from('conversion_history')
        .select(`
          *,
          conversion_templates (
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const history = data?.map(h => this.mapToHistory(h)) || [];

      return {
        items: history,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }, 'Failed to fetch history');
  }

  /**
   * Get recent conversions
   */
  async getRecentConversions(limit: number = 10): Promise<ServiceResponse<ConversionHistory[]>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('conversion_history')
        .select(`
          *,
          conversion_templates (
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(h => this.mapToHistory(h)) || [];
    }, 'Failed to fetch recent conversions');
  }

  /**
   * Delete conversion history entry
   */
  async deleteHistoryEntry(historyId: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { error } = await supabase
        .from('conversion_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', userId);

      if (error) throw error;
    }, 'Failed to delete history entry');
  }

  /**
   * Clear all conversion history
   */
  async clearHistory(): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { error } = await supabase
        .from('conversion_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    }, 'Failed to clear history');
  }

  /**
   * Get conversion statistics
   */
  async getStats(): Promise<ServiceResponse<any>> {
    return this.executeOperation(async () => {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { user_uuid: userId } as any);

      if (error) throw error;
      return data;
    }, 'Failed to fetch conversion stats');
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getUserPreferences(userId: string) {
    const { data } = await supabase
      .from('user_preferences')
      .select('max_file_size_mb, auto_save_history')
      .eq('user_id', userId)
      .maybeSingle();

    return data || { maxFileSizeMb: 10, autoSaveHistory: true };
  }

  private async saveToHistory(
    userId: string | null,
    request: ConversionRequest,
    result: ConversionResult,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    // Check if auto-save is enabled
    if (userId) {
      const prefs = await this.getUserPreferences(userId);
      if (!prefs.autoSaveHistory) return;
    }

    const insertData: Database['public']['Tables']['conversion_history']['Insert'] = {
      user_id: userId,
      template_id: request.templateId || null,
      source_format: request.sourceFormat,
      target_format: request.targetFormat,
      input_size_bytes: result.inputSizeBytes,
      output_size_bytes: result.outputSizeBytes,
      status,
      error_message: errorMessage || null,
      processing_time_ms: result.processingTimeMs,
    };

    const { error } = await supabase
      .from('conversion_history')
      .insert(insertData as any);

    if (error) {
      console.warn('Failed to save conversion to history:', error);
    }
  }

  private mapToHistory(data: any): ConversionHistory {
    return {
      id: data.id,
      userId: data.user_id,
      templateId: data.template_id,
      sourceFormat: data.source_format,
      targetFormat: data.target_format,
      inputSizeBytes: data.input_size_bytes,
      outputSizeBytes: data.output_size_bytes,
      status: data.status,
      errorMessage: data.error_message,
      processingTimeMs: data.processing_time_ms,
      createdAt: data.created_at,
      template: data.conversion_templates ? {
        name: data.conversion_templates.name,
        description: data.conversion_templates.description,
      } : undefined,
    };
  }

  /**
   * Delete a conversion history entry
   */
  async deleteHistory(id: string): Promise<ServiceResponse<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.supabase
        .from('conversion_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }, 'Failed to delete history entry');
  }
}

// Export singleton instance
export const conversionService = new ConversionService();
