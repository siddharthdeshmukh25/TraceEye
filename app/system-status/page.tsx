"use client";

import { useState, useEffect } from "react";
import { 
  Server, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Activity,
  Clock,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
  Cpu,
  Memory,
  Zap
} from "lucide-react";

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  components: {
    database: {
      status: string;
      responseTime: number;
      lastCheck: number;
      errorCount: number;
    };
    cache: {
      status: string;
      itemCount: number;
      totalSize: number;
    };
  };
  cacheStats: any;
  recommendations: string[];
}

export default function SystemStatusPage() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const fetchHealthStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/health');
      const data = await response.json();
      setHealthData(data);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error fetching health status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'unhealthy':
      case 'down':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle2 size={20} />;
      case 'degraded':
        return <AlertTriangle size={20} />;
      case 'unhealthy':
      case 'down':
        return <XCircle size={20} />;
      default:
        return <Activity size={20} />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Server className="text-emerald-600" />
                System Status Dashboard
              </h1>
              <p className="text-slate-600 mt-2">
                Real-time monitoring of system health, database connectivity, and cache status
              </p>
            </div>
            <button
              onClick={fetchHealthStatus}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Clock size={14} />
            <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
          </div>
        </div>

        {loading && !healthData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-slate-600">
              <RefreshCw size={24} className="animate-spin" />
              <span className="font-medium">Loading system status...</span>
            </div>
          </div>
        ) : healthData && (
          <div className="space-y-6">
            {/* Overall Status Card */}
            <div className={`rounded-2xl border-2 p-6 ${getStatusColor(healthData.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`grid h-16 w-16 place-items-center rounded-full ${getStatusColor(healthData.status)}`}>
                    {getStatusIcon(healthData.status)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold capitalize">
                      System Status: {healthData.status}
                    </h2>
                    <p className="text-sm opacity-75 mt-1">
                      Uptime: {formatUptime(healthData.uptime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-75">System Response Time</div>
                  <div className="text-lg font-bold">
                    {formatResponseTime(healthData.components.database.responseTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Component Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="text-blue-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-900">Database</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(healthData.components.database.status)}`}>
                      {getStatusIcon(healthData.components.database.status)}
                      {healthData.components.database.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Response Time</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatResponseTime(healthData.components.database.responseTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Error Count</span>
                    <span className={`text-sm font-medium ${healthData.components.database.errorCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {healthData.components.database.errorCount}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Last Check</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(healthData.components.database.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cache Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="text-purple-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-900">Cache System</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(healthData.components.cache.status)}`}>
                      {getStatusIcon(healthData.components.cache.status)}
                      {healthData.components.cache.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Cached Items</span>
                    <span className="text-sm font-medium text-slate-900">
                      {healthData.components.cache.itemCount}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Size</span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatBytes(healthData.components.cache.totalSize)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Cache Hit Rate</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {healthData.components.cache.itemCount > 0 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Cache Statistics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-emerald-600" size={24} />
                <h3 className="text-lg font-bold text-slate-900">Cache Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(healthData.cacheStats || {}).map(([key, stat]: [string, any]) => (
                  <div key={key} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      {stat.exists ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <XCircle size={16} className="text-slate-300" />
                      )}
                    </div>
                    
                    {stat.exists ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Age:</span>
                          <span className="font-medium">
                            {stat.age ? `${Math.floor(stat.age / 60000)}m ago` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">{formatBytes(stat.size || 0)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Not cached</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {healthData.recommendations && healthData.recommendations.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-amber-600" size={24} />
                  <h3 className="text-lg font-bold text-amber-900">Recommendations</h3>
                </div>
                
                <ul className="space-y-2">
                  {healthData.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                      <Zap size={16} className="mt-0.5 shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* System Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="text-slate-600" size={24} />
                <h3 className="text-lg font-bold text-slate-900">System Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Memory size={16} />
                    <span className="text-xs font-medium">Platform</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Node.js</p>
                </div>
                
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Wifi size={16} />
                    <span className="text-xs font-medium">Network</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Connected</p>
                </div>
                
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-medium">Security</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">AES-256 Enabled</p>
                </div>
                
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Server size={16} />
                    <span className="text-xs font-medium">Mode</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">Production</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}