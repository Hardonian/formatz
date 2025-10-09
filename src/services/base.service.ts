/**
 * Base Service Class
 *
 * Provides common functionality for all services including
 * error handling, logging, and response formatting.
 */

import type { ServiceResponse, ServiceError } from '../types/dtos';
import { supabase } from '../lib/supabase';

export class BaseService {
  protected serviceName: string;
  protected supabase = supabase;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Wrap async operations with consistent error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    errorContext?: string
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return this.success(data);
    } catch (error) {
      return this.handleError(error, errorContext);
    }
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create error response
   */
  protected error(code: string, message: string, details?: any): ServiceResponse<never> {
    const serviceError: ServiceError = {
      code,
      message,
      details,
    };

    this.logError(serviceError);

    return {
      success: false,
      error: serviceError,
    };
  }

  /**
   * Handle various error types
   */
  protected handleError(error: unknown, context?: string): ServiceResponse<never> {
    console.error(`[${this.serviceName}] Error:`, error);

    if (error instanceof Error) {
      return this.error(
        'SERVICE_ERROR',
        context ? `${context}: ${error.message}` : error.message,
        { originalError: error.name }
      );
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      const pgError = error as any;
      return this.error(
        pgError.code || 'DATABASE_ERROR',
        pgError.message || 'Database operation failed',
        pgError
      );
    }

    return this.error(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      { error }
    );
  }

  /**
   * Log errors (can be extended to send to external logging service)
   */
  protected logError(error: ServiceError): void {
    console.error(`[${this.serviceName}] ${error.code}:`, error.message, error.details);
  }

  /**
   * Get current authenticated user ID
   */
  protected async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Validate required fields
   */
  protected validateRequired(
    data: Record<string, any>,
    requiredFields: string[]
  ): void {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Validate data size
   */
  protected validateDataSize(data: string, maxSizeMb: number): void {
    const sizeInBytes = new Blob([data]).size;
    const sizeMb = sizeInBytes / (1024 * 1024);

    if (sizeMb > maxSizeMb) {
      throw new Error(`Data size (${sizeMb.toFixed(2)}MB) exceeds maximum allowed (${maxSizeMb}MB)`);
    }
  }
}
