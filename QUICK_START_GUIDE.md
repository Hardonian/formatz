# DataTextConverter - Quick Start Guide

## Database Connection Setup

### 1. Environment Variables
Your `.env` file is already configured:
```env
VITE_SUPABASE_URL=https://wpjoxxtknefrsioccwjq.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 2. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 3. Create Supabase Client
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY
);
```

---

## Authentication

### Sign Up New User
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
});

// Profile and preferences are created automatically via trigger!
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});
```

### Get Current User
```javascript
const { data: { user } } = await supabase.auth.getUser();
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut();
```

---

## Core Operations

### Create Conversion Template
```javascript
async function createTemplate(userId, templateData) {
  const { data, error } = await supabase
    .from('conversion_templates')
    .insert({
      user_id: userId,
      name: templateData.name,
      description: templateData.description,
      source_format: 'json',
      target_format: 'xml',
      configuration: {
        prettyPrint: true,
        rootElement: 'data'
      },
      is_public: false
    })
    .select()
    .maybeSingle();

  return { data, error };
}
```

### Get User's Templates
```javascript
async function getUserTemplates(userId) {
  const { data, error } = await supabase
    .from('conversion_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}
```

### Save Conversion to History
```javascript
async function saveConversion(conversionData) {
  const { data, error } = await supabase
    .from('conversion_history')
    .insert({
      user_id: conversionData.userId, // can be null for anonymous
      template_id: conversionData.templateId, // optional
      source_format: conversionData.sourceFormat,
      target_format: conversionData.targetFormat,
      input_size_bytes: conversionData.inputSize,
      output_size_bytes: conversionData.outputSize,
      status: 'completed',
      processing_time_ms: conversionData.processingTime
    })
    .select()
    .maybeSingle();

  return { data, error };
}
```

### Get User's Conversion History
```javascript
async function getConversionHistory(userId, limit = 50) {
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

  return { data, error };
}
```

### Browse Public Templates
```javascript
async function getPublicTemplates() {
  const { data, error } = await supabase
    .from('conversion_templates')
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .limit(20);

  return { data, error };
}
```

### Share a Template
```javascript
async function shareTemplate(templateId, ownerId) {
  // Generate share code
  const { data: shareCodeData } = await supabase.rpc('generate_share_code');
  const shareCode = shareCodeData;

  // Create share entry
  const { data, error } = await supabase
    .from('shared_templates')
    .insert({
      template_id: templateId,
      owner_id: ownerId,
      share_code: shareCode
    })
    .select()
    .maybeSingle();

  return { data, error };
}
```

### Get Template by Share Code
```javascript
async function getTemplateByShareCode(shareCode) {
  const { data, error } = await supabase
    .from('shared_templates')
    .select(`
      *,
      conversion_templates (
        *,
        profiles (
          username,
          avatar_url
        )
      )
    `)
    .eq('share_code', shareCode)
    .maybeSingle();

  // Increment view count
  if (data) {
    await supabase
      .from('shared_templates')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id);
  }

  return { data, error };
}
```

### Update User Preferences
```javascript
async function updatePreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      theme: preferences.theme,
      default_source_format: preferences.defaultSourceFormat,
      default_target_format: preferences.defaultTargetFormat,
      auto_save_history: preferences.autoSaveHistory,
      preferences: preferences.customSettings
    })
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  return { data, error };
}
```

### Get User Preferences
```javascript
async function getUserPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}
```

---

## Real-Time Subscriptions

### Listen to Template Changes
```javascript
const channel = supabase
  .channel('template-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'conversion_templates',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Template changed:', payload);
    }
  )
  .subscribe();
```

### Listen to New Conversion History
```javascript
const channel = supabase
  .channel('history-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'conversion_history',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New conversion:', payload.new);
    }
  )
  .subscribe();
```

---

## Error Handling

### Standard Error Pattern
```javascript
async function handleDatabaseOperation() {
  const { data, error } = await supabase
    .from('conversion_templates')
    .select('*');

  if (error) {
    console.error('Database error:', error.message);
    // Handle error (show user message, retry, etc.)
    return null;
  }

  return data;
}
```

### Common Error Codes
- `PGRST116` - Row not found
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42501` - Insufficient permissions (RLS)

---

## Performance Tips

### 1. Use Indexes Effectively
```javascript
// GOOD - Uses index on user_id
const { data } = await supabase
  .from('conversion_templates')
  .select('*')
  .eq('user_id', userId);

// GOOD - Uses compound index on formats
const { data } = await supabase
  .from('conversion_templates')
  .select('*')
  .eq('source_format', 'json')
  .eq('target_format', 'xml');
```

### 2. Limit Results
```javascript
// Always use limit for lists
const { data } = await supabase
  .from('conversion_history')
  .select('*')
  .limit(50);
```

### 3. Select Only Needed Columns
```javascript
// Instead of SELECT *
const { data } = await supabase
  .from('conversion_templates')
  .select('id, name, source_format, target_format')
  .eq('user_id', userId);
```

### 4. Use maybeSingle() for Zero-or-One Results
```javascript
// Prevents errors when no row found
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle(); // Returns null if not found, no error
```

---

## Testing Queries

### Check RLS is Working
```javascript
// Should only return current user's templates
const { data } = await supabase
  .from('conversion_templates')
  .select('*');

console.log('My templates:', data);
```

### Test Anonymous Access
```javascript
// Sign out first
await supabase.auth.signOut();

// Should work - anonymous can insert history
const { data, error } = await supabase
  .from('conversion_history')
  .insert({
    user_id: null,
    source_format: 'json',
    target_format: 'xml',
    status: 'completed'
  });

console.log('Anonymous conversion saved:', data);
```

---

## Development Workflow

### 1. Setup Project
```bash
npm create vite@latest my-converter-app
cd my-converter-app
npm install
npm install @supabase/supabase-js
```

### 2. Create Supabase Client (src/lib/supabase.js)
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY
);
```

### 3. Test Connection
```javascript
// src/App.jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <div>
      <h1>DataTextConverter</h1>
      <p>User: {user ? user.email : 'Not logged in'}</p>
    </div>
  );
}

export default App;
```

### 4. Run Dev Server
```bash
npm run dev
```

---

## Useful SQL Queries

### Get User Stats
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') as successful_conversions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_conversions,
  AVG(processing_time_ms) as avg_processing_time,
  SUM(input_size_bytes) as total_input_bytes
FROM conversion_history
WHERE user_id = 'user-uuid-here';
```

### Most Popular Format Combinations
```sql
SELECT
  source_format,
  target_format,
  COUNT(*) as conversion_count
FROM conversion_history
WHERE status = 'completed'
GROUP BY source_format, target_format
ORDER BY conversion_count DESC
LIMIT 10;
```

### Most Used Templates
```sql
SELECT
  ct.name,
  ct.usage_count,
  p.username
FROM conversion_templates ct
JOIN profiles p ON ct.user_id = p.id
WHERE ct.is_public = true
ORDER BY ct.usage_count DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: "Row Level Security" Error
**Solution:** Make sure user is authenticated and accessing their own data.

### Issue: Profile not created after signup
**Solution:** Check that the `handle_new_user()` trigger is enabled on auth.users.

### Issue: Can't see public templates
**Solution:** Ensure you're authenticated and templates have `is_public = true`.

### Issue: Slow queries
**Solution:** Check you're filtering by indexed columns (user_id, formats, etc.).

---

## Next Steps

1. Build authentication UI (login/signup)
2. Create conversion interface
3. Implement template management
4. Add history dashboard
5. Build public template gallery

---

**Ready to start building!** 🚀
