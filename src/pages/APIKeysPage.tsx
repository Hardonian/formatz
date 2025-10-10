import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notification.store';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  plan_tier: string;
  monthly_quota: number;
  requests_this_month: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function APIKeysPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAPIKeys();
  }, [user]);

  const loadAPIKeys = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    if (!user || !newKeyName.trim()) return;

    try {
      setCreating(true);

      // Generate a unique API key
      const apiKey = `4mz_${generateRandomString(32)}`;
      const keyPrefix = apiKey.substring(0, 12) + '...';
      const keyHash = await hashString(apiKey);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          plan_tier: (user as any).plan_type || 'free',
          monthly_quota: 1000,
        })
        .select()
        .single();

      if (error) throw error;

      // Show the full key once (can't be retrieved again)
      setRevealedKey(apiKey);
      setNewKeyName('');
      setShowNewKeyForm(false);
      await loadAPIKeys();

      showSuccess('API Key Created', 'Save this key securely. You won\'t be able to see it again!');
    } catch (error: any) {
      showError('Error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      await loadAPIKeys();
      showSuccess('API Key Deleted', 'The API key has been removed');
    } catch (error: any) {
      showError('Error', error.message);
    }
  };

  const toggleKeyActive = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      if (error) throw error;

      await loadAPIKeys();
      showSuccess('API Key Updated', `Key ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      showError('Error', error.message);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
    showSuccess('Copied', 'API key copied to clipboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          API Keys
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your API keys for programmatic access to 4matz
        </p>
      </div>

      {/* New Key Revealed */}
      {revealedKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Your new API key
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
            Save this key securely. For security reasons, you won't be able to see it again.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 font-mono text-sm">
              {revealedKey}
            </code>
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(revealedKey, 'revealed')}
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Create New Key Form */}
      {showNewKeyForm ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Create New API Key
          </h3>
          <div className="flex gap-3">
            <Input
              placeholder="Key name (e.g., Production, Development)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={createAPIKey}
              disabled={!newKeyName.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create Key'}
            </Button>
            <Button variant="secondary" onClick={() => setShowNewKeyForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : (
        <Button
          variant="primary"
          onClick={() => setShowNewKeyForm(true)}
          className="mb-6"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New API Key
        </Button>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <KeyIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No API keys yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first API key to start using the 4matz API
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {key.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        key.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      {key.plan_tier}
                    </span>
                  </div>
                  <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {key.key_prefix}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleKeyActive(key.id, key.is_active)}
                  >
                    {key.is_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => deleteAPIKey(key.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usage This Month</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {key.requests_this_month.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {key.monthly_quota.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (key.requests_this_month / key.monthly_quota) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Used</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          API Documentation
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Learn how to integrate 4matz into your applications with our comprehensive API docs.
        </p>
        <Button variant="secondary">
          View API Docs →
        </Button>
      </div>
    </div>
  );
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
