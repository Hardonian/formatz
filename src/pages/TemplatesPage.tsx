import { useState, useEffect } from 'react';
import { templateService } from '@/services';
import type { ConversionTemplate, ConversionFormat } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<ConversionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConversionTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    const response = await templateService.getUserTemplates({
      page: 1,
      limit: 50,
    });

    setLoading(false);

    if (response.success && response.data) {
      setTemplates(response.data.items);
    } else {
      setError(response.error?.message || 'Failed to load templates');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const response = await templateService.deleteTemplate(id);
    if (response.success) {
      setTemplates(templates.filter((t) => t.id !== id));
    } else {
      alert(response.error?.message || 'Failed to delete template');
    }
  };

  const handleToggleFavorite = async (template: ConversionTemplate) => {
    const response = await templateService.toggleFavorite(template.id);
    if (response.success && response.data) {
      setTemplates(
        templates.map((t) =>
          t.id === template.id ? response.data! : t
        )
      );
    }
  };

  const handleDuplicate = async (template: ConversionTemplate) => {
    const response = await templateService.duplicateTemplate(
      template.id,
      `${template.name} (Copy)`
    );

    if (response.success && response.data) {
      loadTemplates();
    } else {
      alert(response.error?.message || 'Failed to duplicate template');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Manage your conversion templates</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No templates yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onDuplicate={handleDuplicate}
              onEdit={setEditingTemplate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadTemplates}
        />
      )}

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={loadTemplates}
        />
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: ConversionTemplate;
  onDelete: (id: string) => void;
  onToggleFavorite: (template: ConversionTemplate) => void;
  onDuplicate: (template: ConversionTemplate) => void;
  onEdit: (template: ConversionTemplate) => void;
}

function TemplateCard({ template, onDelete, onToggleFavorite, onDuplicate, onEdit }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
        <button
          onClick={() => onToggleFavorite(template)}
          className="text-2xl transition-colors"
          aria-label="Toggle favorite"
        >
          {template.isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
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
        {template.isPublic && <span className="text-blue-600">Public</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(template)}>
          Edit
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onDuplicate(template)}>
          Duplicate
        </Button>
        <Button variant="secondary" size="sm" onClick={() => {}}>
          Use
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(template.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}

interface CreateTemplateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateTemplateModal({ onClose, onSuccess }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceFormat, setSourceFormat] = useState<ConversionFormat>('json');
  const [targetFormat, setTargetFormat] = useState<ConversionFormat>('xml');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formats: ConversionFormat[] = ['json', 'xml', 'csv', 'yaml', 'toml', 'html', 'markdown', 'txt'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    const response = await templateService.createTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      sourceFormat,
      targetFormat,
      configuration: { prettyPrint: true },
      isPublic,
    });

    setLoading(false);

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      setError(response.error?.message || 'Failed to create template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Template</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="My Conversion Template"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template does..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Format
              </label>
              <select
                value={sourceFormat}
                onChange={(e) => setSourceFormat(e.target.value as ConversionFormat)}
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
                Target Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value as ConversionFormat)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make this template public
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTemplateModalProps {
  template: ConversionTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

function EditTemplateModal({ template, onClose, onSuccess }: EditTemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || '');
  const [isPublic, setIsPublic] = useState(template.isPublic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    const response = await templateService.updateTemplate(template.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      configuration: template.configuration,
      isPublic,
    });

    setLoading(false);

    if (response.success) {
      onSuccess();
      onClose();
    } else {
      setError(response.error?.message || 'Failed to update template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Template</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublicEdit"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublicEdit" className="ml-2 text-sm text-gray-700">
              Make this template public
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
