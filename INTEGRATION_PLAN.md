# DataTextConverter - Frontend Integration Plan

**Date:** October 9, 2025
**Project:** DataTextConverter Multi-Format Conversion Platform
**Status:** Ready for Frontend Implementation

---

## 1. INTEGRATION ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  React Application                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Pages    │  │ Components │  │   Hooks    │         │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │   │
│  └────────┼───────────────┼───────────────┼────────────────┘   │
│           │               │               │                     │
└───────────┼───────────────┼───────────────┼─────────────────────┘
            │               │               │
┌───────────▼───────────────▼───────────────▼─────────────────────┐
│                   APPLICATION LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Service Orchestration                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │   Auth     │  │ Conversion │  │  Template  │         │   │
│  │  │  Service   │  │  Service   │  │  Service   │         │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │   │
│  └────────┼───────────────┼───────────────┼────────────────┘   │
│           │               │               │                     │
│  ┌────────▼───────────────▼───────────────▼────────────────┐   │
│  │           Base Service & Error Handling                  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Supabase Client                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │    Auth    │  │  Database  │  │  Storage   │         │   │
│  │  │    API     │  │    API     │  │    API     │         │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │   │
│  └────────┼───────────────┼───────────────┼────────────────┘   │
└───────────┼───────────────┼───────────────┼─────────────────────┘
            │               │               │
┌───────────▼───────────────▼───────────────▼─────────────────────┐
│                   SUPABASE BACKEND                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │  PostgreSQL  │  │   Storage    │         │
│  │   System     │  │   Database   │  │    Bucket    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Flow

```
User Action → React Component → Custom Hook → Service Layer → Supabase Client → Database
                     ↓                                ↓                  ↓
                  UI Update  ←──────────  ServiceResponse<T>  ←──  Database Result
```

---

## 2. API SPECIFICATION

### 2.1 Authentication Service API

**File:** `src/services/auth/auth.service.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `signUp` | `SignUpDTO` | `ServiceResponse<AuthResponse>` | Register new user |
| `signIn` | `SignInDTO` | `ServiceResponse<AuthResponse>` | Sign in existing user |
| `signOut` | None | `ServiceResponse<void>` | Sign out current user |
| `getCurrentUser` | None | `ServiceResponse<User \| null>` | Get authenticated user |
| `updatePassword` | `UpdatePasswordDTO` | `ServiceResponse<void>` | Change password |
| `resetPassword` | `email: string` | `ServiceResponse<void>` | Send reset email |
| `isAuthenticated` | None | `Promise<boolean>` | Check auth status |
| `onAuthStateChange` | `callback` | `Subscription` | Listen to auth events |

#### Data Transfer Objects

```typescript
interface SignUpDTO {
  email: string;
  password: string;
  fullName?: string;
  avatarUrl?: string;
}

interface SignInDTO {
  email: string;
  password: string;
}

interface UpdatePasswordDTO {
  newPassword: string;
}

interface AuthResponse {
  user: User;
  session: Session;
}
```

---

### 2.2 Profile Service API

**File:** `src/services/auth/profile.service.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getProfile` | None | `ServiceResponse<UserProfile>` | Get current user profile |
| `updateProfile` | `UpdateProfileDTO` | `ServiceResponse<UserProfile>` | Update profile data |
| `getPreferences` | None | `ServiceResponse<UserPreferences>` | Get user preferences |
| `updatePreferences` | `UpdatePreferencesDTO` | `ServiceResponse<UserPreferences>` | Update preferences |
| `deleteAccount` | None | `ServiceResponse<void>` | Delete user account |

#### Data Transfer Objects

```typescript
interface UpdateProfileDTO {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

interface UpdatePreferencesDTO {
  theme?: ThemeType;
  defaultSourceFormat?: ConversionFormat;
  defaultTargetFormat?: ConversionFormat;
  autoSaveHistory?: boolean;
  maxFileSizeMb?: number;
  preferences?: Record<string, any>;
}
```

---

### 2.3 Template Service API

**File:** `src/services/templates/template.service.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `createTemplate` | `CreateTemplateDTO` | `ServiceResponse<ConversionTemplate>` | Create new template |
| `getUserTemplates` | `PaginationDTO` | `ServiceResponse<PaginatedResult<ConversionTemplate>>` | Get user's templates |
| `getTemplateById` | `id: string` | `ServiceResponse<ConversionTemplate>` | Get specific template |
| `updateTemplate` | `id, UpdateTemplateDTO` | `ServiceResponse<ConversionTemplate>` | Update template |
| `deleteTemplate` | `id: string` | `ServiceResponse<void>` | Delete template |
| `searchTemplates` | `SearchTemplatesDTO` | `ServiceResponse<TemplateSearchResult[]>` | Full-text search |
| `getPublicTemplates` | `PaginationDTO` | `ServiceResponse<PaginatedResult<ConversionTemplate>>` | Browse public templates |
| `toggleFavorite` | `id: string` | `ServiceResponse<ConversionTemplate>` | Mark as favorite |
| `duplicateTemplate` | `id, name` | `ServiceResponse<string>` | Fork template |
| `shareTemplate` | `ShareTemplateDTO` | `ServiceResponse<SharedTemplate>` | Share publicly |

---

### 2.4 Conversion Service API

**File:** `src/services/conversions/conversion.service.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `convert` | `ConvertDTO` | `ServiceResponse<ConversionResult>` | Execute conversion |
| `convertWithTemplate` | `id, data` | `ServiceResponse<ConversionResult>` | Use saved template |
| `validateInput` | `ValidateInputDTO` | `ServiceResponse<ValidationResult>` | Validate format |
| `getHistory` | `PaginationDTO` | `ServiceResponse<PaginatedResult<ConversionHistory>>` | Get user history |
| `getHistoryById` | `id: string` | `ServiceResponse<ConversionHistory>` | Get specific conversion |
| `deleteHistory` | `id: string` | `ServiceResponse<void>` | Delete history entry |
| `getConversionStats` | None | `ServiceResponse<ConversionStats>` | Get user stats |

---

### 2.5 Conversion Engine API

**File:** `src/services/conversions/conversion.engine.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `transform` | `TransformDTO` | `Promise<string>` | Core transformation |
| `parse` | `format, data` | `Promise<any>` | Parse to object |
| `serialize` | `format, data, config` | `Promise<string>` | Object to string |
| `getSupportedFormats` | None | `ConversionFormat[]` | List formats |

#### Supported Formats

1. `json` - JavaScript Object Notation
2. `xml` - Extensible Markup Language
3. `csv` - Comma-Separated Values
4. `yaml` - YAML Ain't Markup Language
5. `toml` - Tom's Obvious Minimal Language
6. `html` - HyperText Markup Language
7. `markdown` - Markdown formatting
8. `txt` - Plain text

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Foundation (Week 1)

**Timeline:** 5 days

#### Day 1: Project Setup
- [ ] Create Vite + React + TypeScript project
- [ ] Install dependencies (React, Supabase, React Router, etc.)
- [ ] Configure environment variables
- [ ] Set up folder structure
- [ ] Configure ESLint, Prettier, TypeScript

#### Day 2: Authentication UI
- [ ] Create login page
- [ ] Create signup page
- [ ] Create password reset page
- [ ] Implement auth context provider
- [ ] Add protected route wrapper
- [ ] Build auth hook (`useAuth`)

#### Day 3: Layout & Navigation
- [ ] Create main layout component
- [ ] Build navigation header
- [ ] Add user profile dropdown
- [ ] Create sidebar navigation
- [ ] Implement responsive design
- [ ] Add theme switcher

#### Day 4: Profile Management
- [ ] Create profile settings page
- [ ] Build profile edit form
- [ ] Add avatar upload component
- [ ] Create preferences panel
- [ ] Implement account deletion

#### Day 5: Error Handling & Loading States
- [ ] Create error boundary component
- [ ] Build loading spinner component
- [ ] Add toast notification system
- [ ] Implement error display component
- [ ] Create empty state components

---

### Phase 2: Core Features (Week 2-3)

**Timeline:** 10 days

#### Day 6-8: Conversion Interface
- [ ] Create conversion workspace page
- [ ] Build format selector dropdowns
- [ ] Add code editor component (Monaco/CodeMirror)
- [ ] Implement real-time conversion
- [ ] Add copy/download buttons
- [ ] Show conversion metrics (size, time)
- [ ] Add format validation

#### Day 9-11: Template Management
- [ ] Create templates list page
- [ ] Build template card component
- [ ] Add create template modal
- [ ] Implement edit template form
- [ ] Add delete confirmation dialog
- [ ] Create template search
- [ ] Build filter by format

#### Day 12-13: History Dashboard
- [ ] Create history page
- [ ] Build history table component
- [ ] Add date range filter
- [ ] Implement format filter
- [ ] Add status filter
- [ ] Create history detail modal
- [ ] Add bulk delete

#### Day 14-15: Public Gallery
- [ ] Create public templates page
- [ ] Build template gallery grid
- [ ] Add search and filters
- [ ] Implement template preview
- [ ] Add fork template button
- [ ] Show usage statistics
- [ ] Create share modal

---

### Phase 3: Advanced Features (Week 4)

**Timeline:** 5 days

#### Day 16-17: Template Sharing
- [ ] Implement share code generation
- [ ] Create share link modal
- [ ] Build template import by code
- [ ] Add social sharing buttons
- [ ] Track view/fork counts

#### Day 18: Performance & UX
- [ ] Add debounced search
- [ ] Implement infinite scroll
- [ ] Add skeleton loaders
- [ ] Optimize re-renders
- [ ] Add keyboard shortcuts

#### Day 19: Analytics Dashboard
- [ ] Create stats overview page
- [ ] Build conversion charts
- [ ] Add popular formats widget
- [ ] Show usage trends
- [ ] Display top templates

#### Day 20: Polish & Testing
- [ ] Fix bugs
- [ ] Add animations
- [ ] Improve accessibility
- [ ] Write component tests
- [ ] End-to-end testing

---

## 4. CODE EXAMPLES

### 4.1 Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '@/services';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current auth state
    authService.getCurrentUser().then((response) => {
      if (response.success) {
        setUser(response.data);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: subscription } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn({ email, password });
    if (!response.success) {
      throw new Error(response.error.message);
    }
    setUser(response.data.user);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const response = await authService.signUp({ email, password, fullName });
    if (!response.success) {
      throw new Error(response.error.message);
    }
    setUser(response.data.user);
  };

  const signOut = async () => {
    const response = await authService.signOut();
    if (!response.success) {
      throw new Error(response.error.message);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### 4.2 Conversion Workspace Component

```typescript
// src/pages/ConversionWorkspace.tsx
import { useState } from 'react';
import { conversionService } from '@/services';
import type { ConversionFormat } from '@/types/dtos';

export function ConversionWorkspace() {
  const [sourceFormat, setSourceFormat] = useState<ConversionFormat>('json');
  const [targetFormat, setTargetFormat] = useState<ConversionFormat>('xml');
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    processingTimeMs: number;
    inputSize: number;
    outputSize: number;
  } | null>(null);

  const handleConvert = async () => {
    if (!inputData.trim()) {
      setError('Input data is required');
      return;
    }

    setLoading(true);
    setError(null);

    const response = await conversionService.convert({
      sourceFormat,
      targetFormat,
      inputData,
      configuration: {
        prettyPrint: true,
      },
    });

    setLoading(false);

    if (response.success) {
      setOutputData(response.data.outputData);
      setMetrics({
        processingTimeMs: response.data.processingTimeMs,
        inputSize: response.data.inputSizeBytes,
        outputSize: response.data.outputSizeBytes,
      });
    } else {
      setError(response.error.message);
    }
  };

  return (
    <div className="conversion-workspace">
      <div className="toolbar">
        <select
          value={sourceFormat}
          onChange={(e) => setSourceFormat(e.target.value as ConversionFormat)}
        >
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="csv">CSV</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
          <option value="html">HTML</option>
          <option value="markdown">Markdown</option>
          <option value="txt">Text</option>
        </select>

        <button onClick={handleConvert} disabled={loading}>
          {loading ? 'Converting...' : 'Convert →'}
        </button>

        <select
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value as ConversionFormat)}
        >
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="csv">CSV</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
          <option value="html">HTML</option>
          <option value="markdown">Markdown</option>
          <option value="txt">Text</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="editors">
        <div className="editor-panel">
          <h3>Input ({sourceFormat.toUpperCase()})</h3>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Paste your data here..."
          />
        </div>

        <div className="editor-panel">
          <h3>Output ({targetFormat.toUpperCase()})</h3>
          <textarea
            value={outputData}
            readOnly
            placeholder="Converted data will appear here..."
          />
        </div>
      </div>

      {metrics && (
        <div className="metrics">
          <span>Time: {metrics.processingTimeMs}ms</span>
          <span>Input: {(metrics.inputSize / 1024).toFixed(2)}KB</span>
          <span>Output: {(metrics.outputSize / 1024).toFixed(2)}KB</span>
        </div>
      )}
    </div>
  );
}
```

---

### 4.3 Template List Component

```typescript
// src/components/templates/TemplateList.tsx
import { useState, useEffect } from 'react';
import { templateService } from '@/services';
import type { ConversionTemplate } from '@/types/dtos';

export function TemplateList() {
  const [templates, setTemplates] = useState<ConversionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const response = await templateService.getUserTemplates({
      page: 1,
      limit: 20,
    });

    setLoading(false);

    if (response.success) {
      setTemplates(response.data.items);
    } else {
      setError(response.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    const response = await templateService.deleteTemplate(id);
    if (response.success) {
      setTemplates(templates.filter((t) => t.id !== id));
    } else {
      alert(response.error.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const response = await templateService.toggleFavorite(id);
    if (response.success) {
      setTemplates(
        templates.map((t) =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        )
      );
    }
  };

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;
  if (templates.length === 0) return <div>No templates yet</div>;

  return (
    <div className="template-list">
      {templates.map((template) => (
        <div key={template.id} className="template-card">
          <div className="template-header">
            <h3>{template.name}</h3>
            <button onClick={() => handleToggleFavorite(template.id)}>
              {template.isFavorite ? '⭐' : '☆'}
            </button>
          </div>

          <p>{template.description}</p>

          <div className="template-meta">
            <span>
              {template.sourceFormat} → {template.targetFormat}
            </span>
            <span>{template.usageCount} uses</span>
          </div>

          <div className="template-actions">
            <button>Edit</button>
            <button>Use</button>
            <button onClick={() => handleDelete(template.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 4.4 Protected Route Wrapper

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

### 4.5 App Router Setup

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ConversionWorkspace } from '@/pages/ConversionWorkspace';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { PublicGalleryPage } from '@/pages/PublicGalleryPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/convert" replace />} />
            <Route path="convert" element={<ConversionWorkspace />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="gallery" element={<PublicGalleryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 5. TESTING STRATEGY

### 5.1 Unit Testing

**Framework:** Vitest + React Testing Library

#### Service Layer Tests

```typescript
// tests/unit/services/conversion.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { conversionService } from '@/services';

describe('ConversionService', () => {
  it('should convert JSON to XML successfully', async () => {
    const response = await conversionService.convert({
      sourceFormat: 'json',
      targetFormat: 'xml',
      inputData: '{"name": "test"}',
      configuration: { prettyPrint: true },
    });

    expect(response.success).toBe(true);
    expect(response.data.outputData).toContain('<name>test</name>');
  });

  it('should handle invalid JSON input', async () => {
    const response = await conversionService.convert({
      sourceFormat: 'json',
      targetFormat: 'xml',
      inputData: '{invalid}',
      configuration: {},
    });

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('PARSE_ERROR');
  });
});
```

#### Component Tests

```typescript
// tests/unit/components/TemplateCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from '@/components/templates/TemplateCard';

describe('TemplateCard', () => {
  const mockTemplate = {
    id: '123',
    name: 'Test Template',
    sourceFormat: 'json',
    targetFormat: 'xml',
    usageCount: 10,
  };

  it('should render template information', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('Test Template')).toBeInTheDocument();
    expect(screen.getByText('json → xml')).toBeInTheDocument();
    expect(screen.getByText('10 uses')).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<TemplateCard template={mockTemplate} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('123');
  });
});
```

---

### 5.2 Integration Testing

#### Authentication Flow

```typescript
// tests/integration/auth-flow.test.ts
import { describe, it, expect } from 'vitest';
import { authService } from '@/services';

describe('Authentication Flow', () => {
  it('should complete full signup and login cycle', async () => {
    // Sign up
    const signUpResponse = await authService.signUp({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    });

    expect(signUpResponse.success).toBe(true);
    expect(signUpResponse.data.user.email).toBe('test@example.com');

    // Sign out
    await authService.signOut();

    // Sign in
    const signInResponse = await authService.signIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(signInResponse.success).toBe(true);
  });
});
```

#### Conversion Flow

```typescript
// tests/integration/conversion-flow.test.ts
import { describe, it, expect } from 'vitest';
import { templateService, conversionService } from '@/services';

describe('Template-Based Conversion Flow', () => {
  it('should create template and use it for conversion', async () => {
    // Create template
    const templateResponse = await templateService.createTemplate({
      name: 'JSON to XML',
      sourceFormat: 'json',
      targetFormat: 'xml',
      configuration: { prettyPrint: true },
    });

    expect(templateResponse.success).toBe(true);
    const templateId = templateResponse.data.id;

    // Use template for conversion
    const conversionResponse = await conversionService.convertWithTemplate(
      templateId,
      '{"test": true}'
    );

    expect(conversionResponse.success).toBe(true);
    expect(conversionResponse.data.outputData).toContain('<test>true</test>');

    // Verify history was saved
    const historyResponse = await conversionService.getHistory({
      page: 1,
      limit: 1,
    });

    expect(historyResponse.success).toBe(true);
    expect(historyResponse.data.items[0].templateId).toBe(templateId);
  });
});
```

---

### 5.3 End-to-End Testing

**Framework:** Playwright

```typescript
// tests/e2e/conversion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Conversion Workspace', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/convert');
  });

  test('should perform JSON to XML conversion', async ({ page }) => {
    // Select formats
    await page.selectOption('select[name="sourceFormat"]', 'json');
    await page.selectOption('select[name="targetFormat"]', 'xml');

    // Enter input data
    await page.fill('textarea[name="input"]', '{"name": "John", "age": 30}');

    // Click convert
    await page.click('button:has-text("Convert")');

    // Wait for result
    await page.waitForSelector('textarea[name="output"]');

    // Verify output
    const output = await page.inputValue('textarea[name="output"]');
    expect(output).toContain('<name>John</name>');
    expect(output).toContain('<age>30</age>');

    // Verify metrics displayed
    await expect(page.locator('.metrics')).toBeVisible();
  });
});
```

---

### 5.4 Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Services | 90%+ | High |
| Components | 80%+ | High |
| Hooks | 85%+ | High |
| Utilities | 95%+ | Medium |
| Types | 100% | Low (TypeScript) |

---

## 6. FOLDER STRUCTURE

```
src/
├── lib/
│   └── supabase.ts                 # Supabase client
│
├── types/
│   ├── database/
│   │   └── schema.ts               # Database types
│   └── dtos/
│       └── index.ts                # Data Transfer Objects
│
├── services/
│   ├── base.service.ts             # Base service class
│   ├── index.ts                    # Service exports
│   ├── auth/
│   │   ├── auth.service.ts         # Authentication
│   │   └── profile.service.ts      # User profiles
│   ├── templates/
│   │   └── template.service.ts     # Template management
│   └── conversions/
│       ├── conversion.service.ts   # Conversion orchestration
│       └── conversion.engine.ts    # Format transformation
│
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useTemplates.ts             # Template management hook
│   ├── useConversion.ts            # Conversion hook
│   └── useDebounce.ts              # Utility hook
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── templates/
│   │   ├── TemplateList.tsx
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateForm.tsx
│   │   └── TemplateSearch.tsx
│   ├── conversions/
│   │   ├── FormatSelector.tsx
│   │   ├── CodeEditor.tsx
│   │   └── ConversionMetrics.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   └── ProtectedRoute.tsx
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── ConversionWorkspace.tsx
│   ├── TemplatesPage.tsx
│   ├── HistoryPage.tsx
│   ├── ProfilePage.tsx
│   └── PublicGalleryPage.tsx
│
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
│
├── styles/
│   ├── globals.css
│   ├── variables.css
│   └── components/
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## 7. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All TypeScript errors resolved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Environment variables configured
- [ ] Supabase migrations applied
- [ ] Build completes successfully
- [ ] No console errors or warnings

### Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

### Environment Variables

```env
# Production .env
VITE_SUPABASE_URL=https://wpjoxxtknefrsioccwjq.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_APP_URL=https://datatextconverter.com
```

### Deployment Platforms

**Recommended:** Vercel, Netlify, or Cloudflare Pages

```bash
# Vercel
npm install -g vercel
vercel --prod

# Netlify
npm install -g netlify-cli
netlify deploy --prod

# Build output directory: dist/
```

---

## 8. MONITORING & ANALYTICS

### Performance Monitoring

- [ ] Track conversion processing times
- [ ] Monitor page load times
- [ ] Measure API response times
- [ ] Track error rates

### User Analytics

- [ ] Track popular format combinations
- [ ] Monitor template usage
- [ ] Measure user retention
- [ ] Track conversion volume

### Tools

- Google Analytics or Plausible for user analytics
- Sentry for error tracking
- Supabase Dashboard for database metrics
- Vercel Analytics for performance

---

## 9. NEXT STEPS

### Immediate Actions

1. **Set up frontend project**
   ```bash
   npm create vite@latest datatextconverter-frontend -- --template react-ts
   cd datatextconverter-frontend
   npm install
   ```

2. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js react-router-dom
   npm install -D @types/react-router-dom vitest @testing-library/react
   ```

3. **Copy service layer**
   - Copy `src/services/` to new project
   - Copy `src/types/` to new project
   - Copy `src/lib/supabase.ts` to new project

4. **Create authentication flow**
   - Implement `useAuth` hook
   - Create login/signup pages
   - Add protected routes

5. **Build conversion interface**
   - Create conversion workspace
   - Add format selectors
   - Integrate conversion engine

---

## 10. SUPPORT & RESOURCES

### Documentation

- **APPLICATION_LAYER_README.md** - Service layer guide
- **DATABASE_HANDOVER.md** - Database architecture
- **QUICK_START_GUIDE.md** - Quick reference

### External Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Integration Status:** Ready for Frontend Implementation ✅

**Backend Services:** Complete and Tested ✅

**Database:** Production Ready ✅

**Next Step:** Begin Phase 1 - Foundation (Week 1)
