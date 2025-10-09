/**
 * Services Index
 *
 * Centralized export point for all application services.
 * Import services from this file throughout the application.
 *
 * @example
 * import { authService, templateService } from '@/services';
 */

// Authentication & User Services
export { authService } from './auth/auth.service';
export { profileService } from './auth/profile.service';

// Template Services
export { templateService } from './templates/template.service';

// Conversion Services
export { conversionService } from './conversions/conversion.service';

// Export service classes for testing/extension
export { AuthService } from './auth/auth.service';
export { ProfileService } from './auth/profile.service';
export { TemplateService } from './templates/template.service';
export { ConversionService } from './conversions/conversion.service';
export { ConversionEngine } from './conversions/conversion.engine';
export { BaseService } from './base.service';

// Re-export common types
export type {
  ServiceResponse,
  ServiceError,
  PaginationParams,
  PaginatedResponse,
} from '../types/dtos';

// Re-export all DTOs
export * from '../types/dtos';
