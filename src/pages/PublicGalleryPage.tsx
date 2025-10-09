import { useState, useEffect } from 'react';
import { templateService } from '@/services';
import type { ConversionTemplate } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';

export function PublicGalleryPage() {
  const [templates, setTemplates] = useState<ConversionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    loadTemplates();
  }, [debouncedSearch, sortBy]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    if (debouncedSearch.trim()) {
      const response = await templateService.searchTemplates({
        query: debouncedSearch,
        limit: 50,
      });

      setLoading(false);

      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error?.message || 'Failed to search templates');
      }
    } else {
      const response = await templateService.getPublicTemplates({
        page: 1,
        limit: 50,
      });

      setLoading(false);

      if (response.success && response.data) {
        let items = response.data.items;

        if (sortBy === 'popular') {
          items = items.sort((a, b) => b.usageCount - a.usageCount);
        } else {
          items = items.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        setTemplates(items);
      } else {
        setError(response.error?.message || 'Failed to load public templates');
      }
    }
  };

  const handleFork = async (template: ConversionTemplate) => {
    const response = await templateService.duplicateTemplate(
      template.id,
      `${template.name} (Forked)`
    );

    if (response.success) {
      alert('Template forked successfully! Check your templates page.');
    } else {
      alert(response.error?.message || 'Failed to fork template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <Button onClick={loadTemplates} variant="secondary" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Gallery</h1>
        <p className="text-gray-600 mt-1">Discover and use templates shared by the community</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {searchQuery ? 'No templates found' : 'No public templates available'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600">
            {templates.length} template{templates.length !== 1 ? 's' : ''} found
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <PublicTemplateCard
                key={template.id}
                template={template}
                onFork={handleFork}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface PublicTemplateCardProps {
  template: ConversionTemplate;
  onFork: (template: ConversionTemplate) => void;
}

function PublicTemplateCard({ template, onFork }: PublicTemplateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
          Public
        </span>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {template.sourceFormat.toUpperCase()}
        </span>
        <span>→</span>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
          {template.targetFormat.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{template.usageCount} uses</span>
        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" size="sm" onClick={() => {}}>
          Use Template
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onFork(template)}>
          Fork
        </Button>
      </div>
    </div>
  );
}
