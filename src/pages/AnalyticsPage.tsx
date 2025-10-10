import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  CpuChipIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { usageService } from '@/services/usage/usage.service';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';

interface AnalyticsStats {
  totalConversions: number;
  thisMonth: number;
  avgProcessingTime: number;
  totalDataProcessed: number;
  popularFormats: Array<{ format: string; count: number }>;
  recentActivity: Array<{
    date: string;
    conversions: number;
  }>;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get usage stats
      const usageResponse = await usageService.getUsageStats(user.id);
      const percentageResponse = await usageService.getUsagePercentage(user.id);

      // Get conversion history
      const { data: conversionHistory } = await supabase
        .from('conversion_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate stats
      const totalConversions = conversionHistory?.length || 0;
      const thisMonth = usageResponse.data?.conversion_count || 0;

      const avgProcessingTime =
        conversionHistory && conversionHistory.length > 0
          ? conversionHistory.reduce((sum, h) => sum + (h.processing_time_ms || 0), 0) /
            conversionHistory.length
          : 0;

      const totalDataProcessed =
        (usageResponse.data?.total_input_bytes || 0) +
        (usageResponse.data?.total_output_bytes || 0);

      // Popular formats
      const formatCounts: Record<string, number> = {};
      conversionHistory?.forEach((h) => {
        const key = `${h.source_format} → ${h.target_format}`;
        formatCounts[key] = (formatCounts[key] || 0) + 1;
      });

      const popularFormats = Object.entries(formatCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([format, count]) => ({ format, count }));

      // Recent activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const recentActivity = last7Days.map((date) => {
        const count = conversionHistory?.filter(
          (h) => h.created_at.startsWith(date)
        ).length || 0;
        return { date, conversions: count };
      });

      setStats({
        totalConversions,
        thisMonth,
        avgProcessingTime,
        totalDataProcessed,
        popularFormats,
        recentActivity,
      });

      if (percentageResponse.success) {
        setUsagePercentage(percentageResponse.data || 0);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No analytics data available yet.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Conversions',
      value: stats.totalConversions.toLocaleString(),
      icon: DocumentDuplicateIcon,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'This Month',
      value: stats.thisMonth.toLocaleString(),
      icon: CalendarIcon,
      color: 'green',
      change: `${usagePercentage}% of limit`,
    },
    {
      title: 'Avg Processing Time',
      value: `${stats.avgProcessingTime.toFixed(0)}ms`,
      icon: ClockIcon,
      color: 'purple',
      change: '-5% faster',
    },
    {
      title: 'Data Processed',
      value: formatBytes(stats.totalDataProcessed),
      icon: CpuChipIcon,
      color: 'orange',
      change: '+23%',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your conversion activity and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900 flex items-center justify-center`}
                >
                  <Icon
                    className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((day, idx) => {
              const maxConversions = Math.max(...stats.recentActivity.map((d) => d.conversions));
              const percentage = maxConversions > 0 ? (day.conversions / maxConversions) * 100 : 0;

              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {day.conversions}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Popular Formats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Popular Conversions
          </h2>
          <div className="space-y-4">
            {stats.popularFormats.map((format, idx) => {
              const maxCount = stats.popularFormats[0]?.count || 1;
              const percentage = (format.count / maxCount) * 100;

              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {format.format}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {format.count} conversions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        idx === 0
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                          : idx === 1
                          ? 'bg-gradient-to-r from-green-500 to-teal-600'
                          : idx === 2
                          ? 'bg-gradient-to-r from-orange-500 to-red-600'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Usage Meter */}
      {usagePercentage > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Usage
            </h3>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {usagePercentage}%
            </span>
          </div>
          <div className="w-full bg-white dark:bg-gray-700 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all ${
                usagePercentage >= 90
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : usagePercentage >= 70
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You've used {stats.thisMonth} of your 50 monthly conversions.
            {usagePercentage >= 80 && (
              <span className="ml-1 font-medium text-orange-600 dark:text-orange-400">
                Consider upgrading to Pro for unlimited conversions!
              </span>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
