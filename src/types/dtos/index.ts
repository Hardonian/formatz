/**
 * Data Transfer Objects (DTOs)
 *
 * Clean interfaces for data transfer between layers.
 * These DTOs abstract database implementation details.
 */

import type { ConversionFormat, PlanType, ThemeType } from '../database/schema';

// Re-export types for external use
export type { ConversionFormat, PlanType, ThemeType } from '../database/schema';

// ============================================
// USER DTOs
// ============================================

export interface UserProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  planType: PlanType;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: ThemeType;
  defaultSourceFormat: string;
  defaultTargetFormat: string;
  autoSaveHistory: boolean;
  maxFileSizeMb: number;
  customPreferences: Record<string, any>;
}

export interface UpdateProfileDTO {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesDTO {
  theme?: ThemeType;
  defaultSourceFormat?: string;
  defaultTargetFormat?: string;
  autoSaveHistory?: boolean;
  maxFileSizeMb?: number;
  customPreferences?: Record<string, any>;
}

// ============================================
// TEMPLATE DTOs
// ============================================

export interface ConversionTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  sourceFormat: ConversionFormat;
  targetFormat: ConversionFormat;
  configuration: TemplateConfiguration;
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface TemplateConfiguration {
  prettyPrint?: boolean;
  includeHeader?: boolean;
  delimiter?: string;
  encoding?: string;
  [key: string]: any;
}

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  sourceFormat: ConversionFormat;
  targetFormat: ConversionFormat;
  configuration: TemplateConfiguration;
  isPublic?: boolean;
  isFavorite?: boolean;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  configuration?: TemplateConfiguration;
  isPublic?: boolean;
  isFavorite?: boolean;
}

export interface TemplateSearchParams {
  query: string;
  sourceFormat?: ConversionFormat;
  targetFormat?: ConversionFormat;
  minRating?: number;
  limit?: number;
}

// ============================================
// CONVERSION DTOs
// ============================================

export interface ConversionRequest {
  sourceFormat: ConversionFormat;
  targetFormat: ConversionFormat;
  inputData: string;
  templateId?: string;
  configuration?: TemplateConfiguration;
}

export interface ConversionResult {
  success: boolean;
  outputData?: string;
  error?: string;
  inputSizeBytes: number;
  outputSizeBytes: number;
  processingTimeMs: number;
}

export interface ConversionHistory {
  id: string;
  userId: string | null;
  templateId: string | null;
  sourceFormat: string;
  targetFormat: string;
  inputSizeBytes: number;
  outputSizeBytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  processingTimeMs: number | null;
  createdAt: string;
  template?: {
    name: string;
    description: string | null;
  };
}

// ============================================
// RATING DTOs
// ============================================

export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  review: string | null;
  isHelpful: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateRatingDTO {
  templateId: string;
  rating: number;
  review?: string;
}

export interface UpdateRatingDTO {
  rating?: number;
  review?: string;
}

export interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  distribution: {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
  };
}

// ============================================
// API KEY DTOs
// ============================================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyDTO {
  name: string;
  expiresInDays?: number;
}

export interface ApiKeyCreated {
  id: string;
  key: string;
  prefix: string;
  expiresAt: string | null;
  warning: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTimeMs: number;
  totalDataTransferredBytes: number;
  requestsByDay: Array<{
    date: string;
    requests: number;
    successful: number;
    avgResponseTime: number;
  }>;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
  }>;
}

// ============================================
// ANALYTICS DTOs
// ============================================

export interface DashboardStats {
  userStats: {
    totalConversions: number;
    successfulConversions: number;
    failedConversions: number;
    totalTemplates: number;
    publicTemplates: number;
    avgProcessingTimeMs: number;
  };
  recentConversions: Array<{
    id: string;
    sourceFormat: string;
    targetFormat: string;
    status: string;
    processingTimeMs: number;
    createdAt: string;
  }>;
  popularFormats: Array<{
    sourceFormat: string;
    targetFormat: string;
    uses: number;
  }>;
}

export interface FormatCombinationStats {
  sourceFormat: string;
  targetFormat: string;
  conversionCount: number;
  successCount: number;
  failureCount: number;
  avgProcessingTimeMs: number;
  lastUsedAt: string;
}

// ============================================
// SERVICE RESPONSE DTOs
// ============================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// PAGINATION DTOs
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
