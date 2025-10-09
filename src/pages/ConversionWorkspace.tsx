import { useState } from 'react';
import { conversionService } from '@/services';
import type { ConversionFormat } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

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

  const formats: ConversionFormat[] = [
    'json',
    'xml',
    'csv',
    'yaml',
    'toml',
    'html',
    'markdown',
    'txt',
  ];

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

    if (response.success && response.data) {
      setOutputData(response.data.outputData || '');
      setMetrics({
        processingTimeMs: response.data.processingTimeMs,
        inputSize: response.data.inputSizeBytes,
        outputSize: response.data.outputSizeBytes,
      });
    } else {
      setError(response.error?.message || 'Conversion failed');
      setOutputData('');
    }
  };

  const handleCopy = async () => {
    if (outputData) {
      await navigator.clipboard.writeText(outputData);
    }
  };

  const handleClear = () => {
    setInputData('');
    setOutputData('');
    setError(null);
    setMetrics(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Data Converter
        </h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="flex items-end pb-2">
            <Button onClick={handleConvert} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Converting...
                </span>
              ) : (
                'Convert →'
              )}
            </Button>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Input ({sourceFormat.toUpperCase()})
              </h3>
              <Button variant="secondary" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Paste your data here..."
              className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Output ({targetFormat.toUpperCase()})
              </h3>
              {outputData && (
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  Copy
                </Button>
              )}
            </div>
            <textarea
              value={outputData}
              readOnly
              placeholder="Converted data will appear here..."
              className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>

        {metrics && (
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            <span>Processing Time: {metrics.processingTimeMs}ms</span>
            <span>Input Size: {(metrics.inputSize / 1024).toFixed(2)}KB</span>
            <span>Output Size: {(metrics.outputSize / 1024).toFixed(2)}KB</span>
          </div>
        )}
      </div>
    </div>
  );
}
