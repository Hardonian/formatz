import { useState, useEffect } from 'react';
import { conversionService } from '@/services';
import type { ConversionHistory } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export function HistoryPage() {
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    const response = await conversionService.getHistory({
      page: 1,
      limit: 100,
    });

    setLoading(false);

    if (response.success && response.data) {
      setHistory(response.data.items);
    } else {
      setError(response.error?.message || 'Failed to load history');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this conversion from history?')) return;

    const response = await conversionService.deleteHistory(id);
    if (response.success) {
      setHistory(history.filter((h) => h.id !== id));
    } else {
      alert(response.error?.message || 'Failed to delete');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear entire conversion history? This cannot be undone.')) return;

    const promises = history.map((h) => conversionService.deleteHistory(h.id));
    await Promise.all(promises);
    loadHistory();
  };

  const filteredHistory = history.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (formatFilter !== 'all' &&
        item.sourceFormat !== formatFilter &&
        item.targetFormat !== formatFilter) return false;
    return true;
  });

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
        <Button onClick={loadHistory} variant="secondary" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conversion History</h1>
          <p className="text-gray-600 mt-1">View and manage your past conversions</p>
        </div>
        {history.length > 0 && (
          <Button variant="danger" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No conversion history yet</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Formats</option>
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

            <div className="ml-auto flex items-end">
              <p className="text-sm text-gray-600">
                Showing {filteredHistory.length} of {history.length} conversions
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.createdAt).toLocaleDateString()} <br />
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {item.sourceFormat.toUpperCase()}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {item.targetFormat.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'completed' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item.inputSizeBytes / 1024).toFixed(2)} KB
                      {' → '}
                      {(item.outputSizeBytes / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.processingTimeMs}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No conversions match your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
