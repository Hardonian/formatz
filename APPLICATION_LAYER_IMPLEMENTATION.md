# Application Layer Implementation Guide

**Date:** October 9, 2025
**Status:** ✅ Complete
**Architecture:** Service-Oriented, Layered Architecture

---

## Overview

This document describes the complete application layer implementation for the DataTextConverter platform. The implementation follows SOLID principles, uses dependency injection patterns, and provides a clean separation of concerns.

## Architecture Principles

### 1. **Layered Architecture**
```
┌──────────────────────────────────────┐
│     Presentation Layer (React)       │
├──────────────────────────────────────┤
│     Application Layer (Services)     │ ← THIS LAYER
├──────────────────────────────────────┤
│     Data Layer (Supabase)            │
└──────────────────────────────────────┘
```

### 2. **Service-Oriented Design**
- Each service handles a specific business domain
- Services are singleton instances
- Services extend BaseService for common functionality
- Clear interfaces defined through DTOs

### 3. **Dependency Injection**
- Services inject dependencies through constructors
- Supabase client is a shared singleton
- Easy to mock for testing

---

## Project Structure

```
src/
├── lib/
│   └── supabase.ts                 # Supabase client configuration
├── services/
│   ├── base.service.ts             # Base service with common functionality
│   ├── auth/
│   │   ├── auth.service.ts         # Authentication
│   │   └── profile.service.ts      # User profiles & preferences
│   ├── templates/
│   │   └── template.service.ts     # Template CRUD & search
│   ├── conversions/
│   │   ├── conversion.service.ts   # Conversion orchestration
│   │   └── conversion.engine.ts    # Format transformation logic
│   ├── ratings/
│   │   └── rating.service.ts       # Template ratings & reviews
│   ├── analytics/
│   │   └── analytics.service.ts    # Dashboard & statistics
│   └── api-keys/
│       └── api-key.service.ts      # API key management
├── types/
│   ├── database/
│   │   └── schema.ts               # Database types
│   └── dtos/
│       └── index.ts                # Data Transfer Objects
└── utils/
    └── validators.ts               # Input validation utilities
```

---

## Core Components

### 1. Base Service (`base.service.ts`)

**Purpose:** Provides common functionality for all services

**Features:**
- Consistent error handling
- Success/error response formatting
- Logging infrastructure
- User authentication helpers
- Data validation utilities

**Example Usage:**
```typescript
class MyService extends BaseService {
  constructor() {
    super('MyService');
  }

  async myOperation(): Promise<ServiceResponse<MyData>> {
    return this.executeOperation(async () => {
      // Your business logic
      return data;
    }, 'Operation failed');
  }
}
```

---

### 2. Authentication Service (`auth.service.ts`)

**Responsibilities:**
- User sign up/sign in/sign out
- Session management
- Password reset
- Email updates
- Auth state monitoring

**Key Methods:**
```typescript
- signUp(credentials): Create new user account
- signIn(credentials): Authenticate existing user
- signOut(): End user session
- getSession(): Retrieve current session
- getCurrentUser(): Get authenticated user details
- updatePassword(newPassword): Change user password
- resetPassword(email): Send password reset email
- onAuthStateChange(callback): Monitor auth changes
```

**Implementation Highlights:**
- Automatic profile creation via database trigger
- Secure password handling (8+ characters)
- Session persistence across page reloads
- Real-time auth state updates

---

### 3. Profile Service (`profile.service.ts`)

**Responsibilities:**
- User profile management
- User preferences (theme, defaults, etc.)
- Dashboard data aggregation
- Username validation

**Key Methods:**
```typescript
- getProfile(userId?): Fetch user profile
- updateProfile(updates): Update profile fields
- getPreferences(userId?): Get user settings
- updatePreferences(updates): Update settings
- getDashboard(userId?): Complete dashboard data
- isUsernameAvailable(username): Check uniqueness
```

**Data Managed:**
- Username, full name, avatar URL
- Plan type (free/pro/enterprise)
- Theme preference (light/dark/auto)
- Default conversion formats
- Auto-save history settings
- File size limits

---

### 4. Template Service (`template.service.ts`)

**Responsibilities:**
- Template CRUD operations
- Template search and discovery
- Public template gallery
- Template favorites
- Template duplication (forking)

**Key Methods:**
```typescript
- createTemplate(dto): Create new template
- getTemplate(id): Get single template
- getUserTemplates(pagination): User's templates
- getPublicTemplates(pagination): Browse public gallery
- searchTemplates(params): Full-text search
- updateTemplate(id, updates): Edit template
- deleteTemplate(id): Remove template
- toggleFavorite(id): Mark/unmark favorite
- duplicateTemplate(id, newName?): Fork template
- getTopRatedTemplates(limit): Top-rated list
```

**Features:**
- Pagination support
- Search with filters (format, rating)
- Owner information included
- Usage statistics
- Rating aggregates

---

### 5. Conversion Service (`conversion.service.ts`)

**Responsibilities:**
- Conversion orchestration
- History tracking
- Data size validation
- Statistics aggregation

**Key Methods:**
```typescript
- convert(request): Execute conversion
- getHistory(pagination): Fetch conversion history
- getRecentConversions(limit): Recent conversions
- deleteHistoryEntry(id): Remove entry
- clearHistory(): Delete all history
- getStats(): Conversion statistics
```

**Conversion Flow:**
1. Validate request (formats, data size)
2. Execute conversion via ConversionEngine
3. Calculate metrics (size, time)
4. Save to history (if enabled)
5. Return result with output data or error

**Features:**
- Anonymous conversions supported
- Auto-save history (configurable)
- Size limits based on plan type
- Performance metrics tracking

---

### 6. Conversion Engine (`conversion.engine.ts`)

**Responsibilities:**
- Format-specific parsing
- Format-specific serialization
- Data transformation

**Supported Formats:**
- JSON ↔ All formats
- XML ↔ All formats
- CSV ↔ All formats
- YAML ↔ All formats (requires library)
- TOML ↔ All formats (requires library)
- HTML ↔ All formats
- Markdown ↔ All formats
- TXT ↔ All formats

**Architecture:**
```
Input (source format)
    ↓
Parse to intermediate representation (Object/Array)
    ↓
Serialize to target format
    ↓
Output (target format)
```

**Configuration Options:**
- `prettyPrint`: Format output (JSON, XML)
- `includeHeader`: CSV headers
- `delimiter`: CSV separator
- `rootElement`: XML root tag
- `includeDeclaration`: XML declaration

**Extension Points:**
To add new formats:
1. Add format type to schema
2. Implement `parse<Format>()` method
3. Implement `serialize<Format>()` method
4. Add to switch statements

---

## Data Transfer Objects (DTOs)

### Purpose
- Clean interfaces for data transfer
- Abstract database implementation details
- Type safety across application
- Validation contracts

### Categories

**User DTOs:**
- UserProfile
- UserPreferences
- UpdateProfileDTO
- UpdatePreferencesDTO

**Template DTOs:**
- ConversionTemplate
- CreateTemplateDTO
- UpdateTemplateDTO
- TemplateSearchParams
- TemplateConfiguration

**Conversion DTOs:**
- ConversionRequest
- ConversionResult
- ConversionHistory

**Rating DTOs:**
- TemplateRating
- CreateRatingDTO
- UpdateRatingDTO
- RatingSummary

**API Key DTOs:**
- ApiKey
- CreateApiKeyDTO
- ApiKeyCreated
- ApiUsageStats

**Analytics DTOs:**
- DashboardStats
- FormatCombinationStats

**Common DTOs:**
- ServiceResponse<T>
- ServiceError
- PaginationParams
- PaginatedResponse<T>

---

## Error Handling Strategy

### Error Types

**1. Service Errors**
```typescript
{
  code: 'SERVICE_ERROR',
  message: 'Descriptive error message',
  details: { /* additional context */ }
}
```

**2. Database Errors**
```typescript
{
  code: 'DATABASE_ERROR' | PostgreSQL error code,
  message: 'Database operation failed',
  details: { /* Supabase error */ }
}
```

**3. Validation Errors**
```typescript
{
  code: 'VALIDATION_ERROR',
  message: 'Missing required fields: email, password',
  details: { fields: ['email', 'password'] }
}
```

### Error Flow

```typescript
try {
  // Operation
} catch (error) {
  // BaseService.handleError()
  // → Log error
  // → Format error response
  // → Return ServiceResponse with error
}
```

### Client Handling

```typescript
const response = await templateService.createTemplate(dto);

if (response.success) {
  // Use response.data
  const template = response.data;
} else {
  // Handle response.error
  console.error(response.error.message);
  showToast(response.error.message);
}
```

---

## Usage Examples

### Example 1: User Authentication Flow

```typescript
import { authService, profileService } from './services';

// Sign Up
async function signUp() {
  const response = await authService.signUp({
    email: 'user@example.com',
    password: 'securePassword123',
    fullName: 'John Doe',
    username: 'johndoe'
  });

  if (response.success) {
    console.log('User created:', response.data.user);

    // Profile and preferences automatically created via trigger
    const profile = await profileService.getProfile();
    console.log('Profile:', profile.data);
  } else {
    console.error('Sign up failed:', response.error.message);
  }
}

// Sign In
async function signIn() {
  const response = await authService.signIn({
    email: 'user@example.com',
    password: 'securePassword123'
  });

  if (response.success) {
    console.log('Signed in:', response.data.user);
  }
}

// Monitor Auth State
authService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (session) {
    console.log('User:', session.user);
  } else {
    console.log('User signed out');
  }
});
```

### Example 2: Template Management

```typescript
import { templateService } from './services';

// Create Template
async function createTemplate() {
  const response = await templateService.createTemplate({
    name: 'JSON to XML Converter',
    description: 'Convert JSON data to XML format',
    sourceFormat: 'json',
    targetFormat: 'xml',
    configuration: {
      prettyPrint: true,
      rootElement: 'data',
      includeDeclaration: true
    },
    isPublic: true
  });

  if (response.success) {
    console.log('Template created:', response.data);
  }
}

// Search Templates
async function searchTemplates() {
  const response = await templateService.searchTemplates({
    query: 'json xml',
    sourceFormat: 'json',
    minRating: 4.0,
    limit: 10
  });

  if (response.success) {
    response.data.forEach(template => {
      console.log(`${template.name} - ${template.avgRating}⭐`);
    });
  }
}

// Fork Template
async function forkTemplate(templateId: string) {
  const response = await templateService.duplicateTemplate(
    templateId,
    'My Custom Version'
  );

  if (response.success) {
    console.log('New template ID:', response.data);
  }
}
```

### Example 3: Data Conversion

```typescript
import { conversionService } from './services';

// Convert JSON to XML
async function convertData() {
  const response = await conversionService.convert({
    sourceFormat: 'json',
    targetFormat: 'xml',
    inputData: JSON.stringify({ name: 'John', age: 30 }),
    configuration: {
      prettyPrint: true,
      rootElement: 'person'
    }
  });

  if (response.success) {
    console.log('Conversion successful!');
    console.log('Output:', response.data.outputData);
    console.log('Processing time:', response.data.processingTimeMs, 'ms');
    console.log('Size:', response.data.outputSizeBytes, 'bytes');
  } else {
    console.error('Conversion failed:', response.error);
  }
}

// Get Conversion History
async function getHistory() {
  const response = await conversionService.getHistory({
    page: 1,
    limit: 20
  });

  if (response.success) {
    console.log('Total conversions:', response.data.total);
    response.data.items.forEach(entry => {
      console.log(`${entry.sourceFormat} → ${entry.targetFormat}`);
      console.log(`Status: ${entry.status}`);
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

Test each service method in isolation with mocked dependencies.

**Example Test:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  it('should create template successfully', async () => {
    const service = new TemplateService();

    const dto = {
      name: 'Test Template',
      sourceFormat: 'json' as const,
      targetFormat: 'xml' as const,
      configuration: {}
    };

    const response = await service.createTemplate(dto);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.name).toBe('Test Template');
  });

  it('should handle validation errors', async () => {
    const service = new TemplateService();

    const invalidDto = {
      name: '',
      sourceFormat: 'json' as const,
      targetFormat: 'xml' as const,
      configuration: {}
    };

    const response = await service.createTemplate(invalidDto);

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
```

### Integration Tests

Test service interactions with real Supabase instance.

```typescript
describe('Auth Integration', () => {
  it('should create user and profile', async () => {
    const authResponse = await authService.signUp({
      email: 'test@example.com',
      password: 'testPassword123'
    });

    expect(authResponse.success).toBe(true);

    // Verify profile was auto-created
    const profileResponse = await profileService.getProfile();
    expect(profileResponse.success).toBe(true);
  });
});
```

---

## Performance Considerations

### 1. **Pagination**
All list operations support pagination to avoid loading large datasets.

### 2. **Caching Strategy**
- Profile data cached in React Context
- Session cached by Supabase client
- Template lists can be cached with React Query

### 3. **Lazy Loading**
- Conversion history loaded on-demand
- Public templates loaded in batches
- Search results limited by default

### 4. **Optimistic Updates**
Services return data immediately; UI can update optimistically.

### 5. **Batch Operations**
Template ratings auto-update aggregates via database triggers (no N+1 queries).

---

## Security Considerations

### 1. **Row Level Security (RLS)**
All database operations go through Supabase RLS policies. Services don't need permission checks - the database enforces them.

### 2. **Input Validation**
All DTOs validated before processing:
- Required fields checked
- Data types validated
- Size limits enforced
- Format constraints verified

### 3. **Authentication Required**
Most operations require authentication. Anonymous operations explicitly supported (e.g., conversions).

### 4. **API Key Security**
API keys are SHA-256 hashed before storage. Original keys never stored or logged.

### 5. **Error Message Safety**
Error messages don't expose sensitive system information. Detailed errors logged server-side only.

---

## Extension Guidelines

### Adding a New Service

1. **Create service class extending BaseService**
```typescript
export class NewService extends BaseService {
  constructor() {
    super('NewService');
  }
}
```

2. **Define DTOs**
Add to `types/dtos/index.ts`

3. **Implement methods**
Use `executeOperation()` wrapper

4. **Export singleton**
```typescript
export const newService = new NewService();
```

5. **Write tests**
Unit + integration tests

### Adding a New Conversion Format

1. **Add to schema types**
```typescript
export type ConversionFormat = '...' | 'newformat';
```

2. **Implement parser**
```typescript
private parseNewFormat(data: string): any {
  // Parse logic
}
```

3. **Implement serializer**
```typescript
private serializeNewFormat(data: any): string {
  // Serialize logic
}
```

4. **Add to switch statements**
In both `parse()` and `serialize()` methods

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase credentials set
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript types generated
- [ ] Build successful (`npm run build`)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Error logging configured
- [ ] Performance monitoring enabled

---

## Conclusion

This application layer provides a robust, type-safe, testable foundation for the DataTextConverter platform. Key strengths:

✅ **Clean Architecture** - Clear separation of concerns
✅ **Type Safety** - Full TypeScript coverage
✅ **Error Handling** - Consistent error management
✅ **Extensibility** - Easy to add new features
✅ **Testability** - Services easily mocked
✅ **Performance** - Optimized queries and caching
✅ **Security** - RLS enforcement and validation

The implementation is production-ready and follows industry best practices for enterprise applications.

---

**Implementation Complete** ✅
**Date:** October 9, 2025
