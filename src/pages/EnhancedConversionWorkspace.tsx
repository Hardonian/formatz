import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
  BookmarkIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { conversionService } from '@/services';
import type { ConversionFormat } from '@/types/dtos';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useNotificationStore } from '@/stores/notification.store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function EnhancedConversionWorkspace() {
  const [sourceFormat, setSourceFormat] = useState<ConversionFormat>('json');
  const [targetFormat, setTargetFormat] = useState<ConversionFormat>('xml');
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<{
    processingTimeMs: number;
    inputSize: number;
    outputSize: number;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const { showSuccess, showError, showInfo } = useNotificationStore();

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

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrl: true,
      description: 'Convert data',
      action: handleConvert,
      disabled: loading || !inputData.trim(),
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Copy output',
      action: handleCopy,
      disabled: !outputData,
    },
    {
      key: 'k',
      ctrl: true,
      shift: true,
      description: 'Clear all',
      action: handleClear,
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      description: 'Swap formats',
      action: handleSwapFormats,
    },
  ]);

  async function handleConvert() {
    if (!inputData.trim()) {
      showError('Input Required', 'Please enter some data to convert');
      return;
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();
    const response = await conversionService.convert({
      sourceFormat,
      targetFormat,
      inputData,
      configuration: {
        prettyPrint: true,
      },
    });

    setLoading(false);
    const endTime = performance.now();

    if (response.success && response.data) {
      setOutputData(response.data.outputData || '');
      setMetrics({
        processingTimeMs: Math.round(endTime - startTime),
        inputSize: response.data.inputSizeBytes,
        outputSize: response.data.outputSizeBytes,
      });
      showSuccess('Conversion Complete', `Converted from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}`);
    } else {
      setError(response.error?.message || 'Conversion failed');
      setOutputData('');
      showError('Conversion Failed', response.error?.message || 'An error occurred');
    }
  }

  async function handleCopy() {
    if (outputData) {
      await navigator.clipboard.writeText(outputData);
      setCopied(true);
      showSuccess('Copied!', 'Output copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClear() {
    setInputData('');
    setOutputData('');
    setError(null);
    setMetrics(null);
    showInfo('Cleared', 'Workspace has been cleared');
  }

  function handleSwapFormats() {
    const temp = sourceFormat;
    setSourceFormat(targetFormat);
    setTargetFormat(temp);
    if (outputData) {
      setInputData(outputData);
      setOutputData('');
    }
    showInfo('Swapped', 'Source and target formats swapped');
  }

  function loadSampleData() {
    const samples: Record<ConversionFormat, string> = {
      json: '{\n  "name": "John Doe",\n  "age": 30,\n  "email": "john@example.com",\n  "active": true\n}',
      xml: '<?xml version="1.0"?>\n<person>\n  <name>John Doe</name>\n  <age>30</age>\n  <email>john@example.com</email>\n  <active>true</active>\n</person>',
      csv: 'name,age,email,active\nJohn Doe,30,john@example.com,true',
      yaml: 'name: John Doe\nage: 30\nemail: john@example.com\nactive: true',
      toml: 'name = "John Doe"\nage = 30\nemail = "john@example.com"\nactive = true',
      html: '<div class="person">\n  <h1>John Doe</h1>\n  <p>Age: 30</p>\n  <p>Email: john@example.com</p>\n</div>',
      markdown: '# John Doe\n\n**Age:** 30  \n**Email:** john@example.com  \n**Status:** Active',
      txt: 'Name: John Doe\nAge: 30\nEmail: john@example.com\nActive: true',
    };
    setInputData(samples[sourceFormat] || samples.json);
    showInfo('Sample Loaded', `Loaded sample ${sourceFormat.toUpperCase()} data`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-green-500 rounded-xl shadow-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="4matz"
                className="h-10 w-10 rounded-lg"
              />
              4matz Data Converter
            </h1>
            <p className="text-green-100 dark:text-green-50">
              Convert between 8 data formats instantly
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={loadSampleData}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Load Sample Data
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Conversion Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        {/* Format Selectors */}
        <div className="flex items-center gap-4 mb-6">
          {/* Source Format */}
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.01 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Source Format
            </label>
            <select
              value={sourceFormat}
              onChange={(e) => setSourceFormat(e.target.value as ConversionFormat)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-all"
              aria-label="Source format"
            >
              {formats.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Swap Button */}
          <motion.div
            className="flex items-end pb-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <button
              onClick={handleSwapFormats}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Swap formats"
              title="Swap formats (Ctrl+Shift+S)"
            >
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Convert Button */}
          <motion.div
            className="flex items-end pb-2"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <Button
              onClick={handleConvert}
              disabled={loading || !inputData.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 disabled:from-gray-400 disabled:to-gray-500"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Converting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ArrowPathIcon className="h-5 w-5" />
                  Convert
                </span>
              )}
            </Button>
          </motion.div>

          {/* Target Format */}
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.01 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Target Format
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as ConversionFormat)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-all"
              aria-label="Target format"
            >
              {formats.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </motion.div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  1
                </span>
                Input ({sourceFormat.toUpperCase()})
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                title="Clear (Ctrl+Shift+K)"
              >
                <TrashIcon className="h-4 w-4" />
                Clear
              </motion.button>
            </div>
            <motion.textarea
              ref={inputRef}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Paste or type your data here..."
              className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus-ring bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
              whileFocus={{ scale: 1.005 }}
              aria-label="Input data"
            />
          </div>

          {/* Output Area */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs font-bold">
                  2
                </span>
                Output ({targetFormat.toUpperCase()})
              </h3>
              {outputData && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                  title="Copy (Ctrl+Shift+C)"
                >
                  {copied ? (
                    <>
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </motion.button>
              )}
            </div>
            <motion.textarea
              ref={outputRef}
              value={outputData}
              readOnly
              placeholder="Converted data will appear here..."
              className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              whileFocus={{ scale: 1.005 }}
              aria-label="Output data"
            />
          </div>
        </div>

        {/* Metrics */}
        <AnimatePresence>
          {metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Processing Time:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {metrics.processingTimeMs}ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Input Size:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(metrics.inputSize / 1024).toFixed(2)}KB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Output Size:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(metrics.outputSize / 1024).toFixed(2)}KB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Compression:</span>
                <span className={`font-semibold ${
                  metrics.outputSize < metrics.inputSize
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {((metrics.outputSize / metrics.inputSize) * 100).toFixed(1)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Keyboard Shortcuts
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800 dark:text-blue-200">
          <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Ctrl+Enter</kbd> Convert</div>
          <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Ctrl+Shift+C</kbd> Copy</div>
          <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Ctrl+Shift+K</kbd> Clear</div>
          <div><kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Ctrl+Shift+S</kbd> Swap</div>
        </div>
      </motion.div>
    </div>
  );
}
