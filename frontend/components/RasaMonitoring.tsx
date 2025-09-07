import React, { useState, useEffect } from 'react';
import {
  Activity,
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  MessageSquare
} from 'lucide-react';

interface RasaStats {
  dailyStats: Array<{
    date: string;
    total_conversations: number;
    successful_conversations: number;
    avg_processing_time: number;
    booking_attempts: number;
    horoscope_queries: number;
    general_questions: number;
  }>;
  overallStats: {
    total_conversations: number;
    successful_conversations: number;
    avg_processing_time: number;
    first_conversation: string;
    last_conversation: string;
  };
}

interface IntentPerformance {
  intent: string;
  total_occurrences: number;
  successful_predictions: number;
  accuracy_percentage: number;
  avg_processing_time: number;
  avg_confidence: number;
}

interface ErrorAnalysis {
  error_type: string;
  error_message: string;
  error_count: number;
  last_occurrence: string;
  affected_users: number;
}

interface PerformanceMetrics {
  avg_processing_time: number;
  min_processing_time: number;
  max_processing_time: number;
  median_processing_time: number;
  p95_processing_time: number;
  avg_confidence: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
}

interface RasaHealth {
  status: 'healthy' | 'unhealthy';
  rasa?: any;
  error?: string;
  timestamp: string;
}

export function RasaMonitoring() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Data states
  const [health, setHealth] = useState<RasaHealth | null>(null);
  const [stats, setStats] = useState<RasaStats | null>(null);
  const [intentPerformance, setIntentPerformance] = useState<IntentPerformance[]>([]);
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysis[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchData = async (action: string, params?: Record<string, string>) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        action,
        ...params,
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });

      const response = await fetch(`/api/admin/rasa?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        switch (action) {
          case 'health':
            setHealth(data.data);
            break;
          case 'stats':
            setStats(data.data);
            break;
          case 'intent-performance':
            setIntentPerformance(data.data);
            break;
          case 'error-analysis':
            setErrorAnalysis(data.data.errorStats);
            break;
          case 'performance-metrics':
            setPerformanceMetrics(data.data.overallMetrics);
            break;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${action}:`, error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchData('health'),
      fetchData('stats'),
      fetchData('intent-performance'),
      fetchData('error-analysis'),
      fetchData('performance-metrics')
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, [dateRange]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'intents', label: 'Intent Performance', icon: Target },
    { id: 'errors', label: 'Error Analysis', icon: AlertTriangle },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'health', label: 'Health Status', icon: Activity }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Rasa Monitoring
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              AI Model Performance & Analytics
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-[var(--color-border-500)] rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
            />
            <span className="text-[var(--color-text-secondary)]">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-[var(--color-border-500)] rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)]"
            />
          </div>
          
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Last Refresh Info */}
      {lastRefresh && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-[var(--color-background-secondary)] p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-[var(--color-background-primary)] rounded-lg border border-[var(--color-border-500)] p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-[var(--color-text-secondary)]">Loading...</span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Conversations</p>
                    <p className="text-3xl font-bold">{formatNumber(stats.overallStats.total_conversations)}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Success Rate</p>
                    <p className="text-3xl font-bold">
                      {((stats.overallStats.successful_conversations / stats.overallStats.total_conversations) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Avg Response Time</p>
                    <p className="text-3xl font-bold">{formatTime(stats.overallStats.avg_processing_time)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Booking Attempts</p>
                    <p className="text-3xl font-bold">
                      {stats.dailyStats.reduce((sum, day) => sum + day.booking_attempts, 0)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Daily Stats Chart */}
            <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Daily Conversation Trends
              </h3>
              <div className="space-y-4">
                {stats.dailyStats.slice(0, 7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {day.total_conversations} total
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {day.successful_conversations} successful
                        </span>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {formatTime(day.avg_processing_time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Intent Performance Tab */}
        {activeTab === 'intents' && intentPerformance.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Intent Performance Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border-500)]">
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Intent</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Total</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Successful</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Accuracy</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Avg Time</th>
                    <th className="text-left py-3 px-4 text-[var(--color-text-primary)]">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {intentPerformance.map((intent, index) => (
                    <tr key={index} className="border-b border-[var(--color-border-300)]">
                      <td className="py-3 px-4 text-[var(--color-text-primary)] font-medium">
                        {intent.intent}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {intent.total_occurrences}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {intent.successful_predictions}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${getAccuracyColor(intent.accuracy_percentage)}`}>
                        {intent.accuracy_percentage}%
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {formatTime(intent.avg_processing_time)}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                        {(intent.avg_confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error Analysis Tab */}
        {activeTab === 'errors' && errorAnalysis.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Error Analysis
            </h3>
            <div className="space-y-4">
              {errorAnalysis.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-red-800">{error.error_type}</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                          {error.error_count} occurrences
                        </span>
                      </div>
                      <p className="text-red-700 text-sm mb-2">{error.error_message}</p>
                      <div className="flex items-center space-x-4 text-xs text-red-600">
                        <span>Last: {new Date(error.last_occurrence).toLocaleString()}</span>
                        <span>Users affected: {error.affected_users}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performanceMetrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Response Times</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Average:</span>
                    <span className="text-[var(--color-text-primary)]">{formatTime(performanceMetrics.avg_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Median:</span>
                    <span className="text-[var(--color-text-primary)]">{formatTime(performanceMetrics.median_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">95th Percentile:</span>
                    <span className="text-[var(--color-text-primary)]">{formatTime(performanceMetrics.p95_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Min:</span>
                    <span className="text-[var(--color-text-primary)]">{formatTime(performanceMetrics.min_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Max:</span>
                    <span className="text-[var(--color-text-primary)]">{formatTime(performanceMetrics.max_processing_time)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Request Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Total Requests:</span>
                    <span className="text-[var(--color-text-primary)]">{formatNumber(performanceMetrics.total_requests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Successful:</span>
                    <span className="text-green-500">{formatNumber(performanceMetrics.successful_requests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Failed:</span>
                    <span className="text-red-500">{formatNumber(performanceMetrics.failed_requests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Success Rate:</span>
                    <span className="text-[var(--color-text-primary)]">
                      {((performanceMetrics.successful_requests / performanceMetrics.total_requests) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-background-secondary)] p-6 rounded-lg">
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-4">Confidence Scores</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Average:</span>
                    <span className="text-[var(--color-text-primary)]">{(performanceMetrics.avg_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              System Health Status
            </h3>
            {health ? (
              <div className="space-y-4">
                <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                  health.status === 'healthy' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`w-4 h-4 rounded-full ${
                    health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <h4 className={`font-semibold ${
                      health.status === 'healthy' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Rasa Server: {health.status === 'healthy' ? 'Online' : 'Offline'}
                    </h4>
                    <p className={`text-sm ${
                      health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {health.status === 'healthy' 
                        ? 'Server is responding normally' 
                        : health.error || 'Server is not responding'
                      }
                    </p>
                  </div>
                </div>

                {health.rasa && (
                  <div className="bg-[var(--color-background-secondary)] p-4 rounded-lg">
                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">
                      Server Information
                    </h4>
                    <pre className="text-sm text-[var(--color-text-secondary)] overflow-x-auto">
                      {JSON.stringify(health.rasa, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">No health data available</p>
              </div>
            )}
          </div>
        )}

        {/* Empty States */}
        {!loading && activeTab === 'intents' && intentPerformance.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
            <p className="text-[var(--color-text-secondary)]">No intent performance data available</p>
          </div>
        )}

        {!loading && activeTab === 'errors' && errorAnalysis.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-[var(--color-text-secondary)]">No errors found in the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}
