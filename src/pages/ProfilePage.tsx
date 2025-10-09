import { useState, useEffect } from 'react';
import { profileService } from '@/services';
import type { UserProfile, UserPreferences, ThemeType } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'preferences'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preferences
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab userEmail={user?.email || ''} />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ userEmail }: { userEmail: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const response = await profileService.getProfile();
    setLoading(false);

    if (response.success && response.data) {
      setProfile(response.data);
      setUsername(response.data.username || '');
      setFullName(response.data.fullName || '');
    } else {
      setError(response.error?.message || 'Failed to load profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const response = await profileService.updateProfile({
      username: username.trim() || undefined,
      fullName: fullName.trim() || undefined,
    });

    setSaving(false);

    if (response.success) {
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(response.error?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={userEmail}
          disabled
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
      />

      <Input
        label="Full Name"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Your full name"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
        <input
          type="text"
          value={profile?.planType || 'free'}
          disabled
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 capitalize"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

function PreferencesTab() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [theme, setTheme] = useState<ThemeType>('light');
  const [defaultSourceFormat, setDefaultSourceFormat] = useState('json');
  const [defaultTargetFormat, setDefaultTargetFormat] = useState('xml');
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    const response = await profileService.getPreferences();
    setLoading(false);

    if (response.success && response.data) {
      setPreferences(response.data);
      setTheme(response.data.theme);
      setDefaultSourceFormat(response.data.defaultSourceFormat);
      setDefaultTargetFormat(response.data.defaultTargetFormat);
      setAutoSaveHistory(response.data.autoSaveHistory);
    } else {
      setError(response.error?.message || 'Failed to load preferences');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const response = await profileService.updatePreferences({
      theme,
      defaultSourceFormat,
      defaultTargetFormat,
      autoSaveHistory,
    });

    setSaving(false);

    if (response.success) {
      setSuccess('Preferences updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(response.error?.message || 'Failed to update preferences');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const formats = ['json', 'xml', 'csv', 'yaml', 'toml', 'html', 'markdown', 'txt'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Source Format
        </label>
        <select
          value={defaultSourceFormat}
          onChange={(e) => setDefaultSourceFormat(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formats.map((format) => (
            <option key={format} value={format}>
              {format.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Target Format
        </label>
        <select
          value={defaultTargetFormat}
          onChange={(e) => setDefaultTargetFormat(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formats.map((format) => (
            <option key={format} value={format}>
              {format.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoSaveHistory"
          checked={autoSaveHistory}
          onChange={(e) => setAutoSaveHistory(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="autoSaveHistory" className="ml-2 text-sm text-gray-700">
          Automatically save conversion history
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max File Size
        </label>
        <input
          type="text"
          value={`${preferences?.maxFileSizeMb || 10} MB`}
          disabled
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          Determined by your plan type
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
}
