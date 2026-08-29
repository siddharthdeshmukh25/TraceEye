"use client";

import { useState, useEffect } from "react";
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  Wifi,
  X as CloseIcon
} from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  errorCount: number;
  databaseUptime: number;
}

interface CacheStats {
  [key: string]: {
    exists: boolean;
    age?: number;
    size?: number;
    error?: string;
  };
}

export default function SystemStatusPanel() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      setIsUserAuthenticated(isAuthenticated());
    };
    
    checkAuth();
    
    // Listen for auth changes
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  // Real health status check
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        // Check database health via API
        const healthResponse = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealthStatus({
            database: healthData.database === 'connected' ? 'healthy' : 'down',
            lastCheck: Date.now(),
            errorCount: healthData.errorCount || 0,
            databaseUptime: healthData.uptime || 0
          });
        } else {
          setHealthStatus({
            database: 'degraded',
            lastCheck: Date.now(),
            errorCount: 1,
            databaseUptime: 0
          });
        }
      } catch (error) {
        setHealthStatus({
          database: 'down',
          lastCheck: Date.now(),
          errorCount: 1,
          databaseUptime: 0
        });
      }
    };

    // Check cache stats from localStorage
    const checkCacheStats = () => {
      const caches = ['traceeye_cache_batches', 'traceeye_cache_producers', 'traceeye_cache_handovers', 'traceeye_cache_alerts', 'traceeye_cache_cardVisits'];
      const stats: CacheStats = {};
      
      caches.forEach(cacheKey => {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const data = JSON.parse(cached);
            const keyName = cacheKey.replace('traceeye_cache_', '');
            stats[keyName] = {
              exists: true,
              age: Date.now() - (data.timestamp || Date.now()),
              size: JSON.stringify(data).length
            };
          } else {
            const keyName = cacheKey.replace('traceeye_cache_', '');
            stats[keyName] = { exists: false };
          }
        } catch (error) {
          const keyName = cacheKey.replace('traceeye_cache_', '');
          stats[keyName] = { exists: false, error: 'Parse error' };
        }
      });
      
      setCacheStats(stats);
    };

    checkSystemHealth();
    checkCacheStats();

    // Refresh health status every 30 seconds
    const healthInterval = setInterval(checkSystemHealth, 30000);
    
    return () => {
      clearInterval(healthInterval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'down':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 size={16} />;
      case 'degraded':
        return <AlertTriangle size={16} />;
      case 'down':
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupMessage(null);
    
    try {
      // Create backup from localStorage
      const caches = ['traceeye_cache_batches', 'traceeye_cache_producers', 'traceeye_cache_handovers', 'traceeye_cache_alerts', 'traceeye_cache_cardVisits'];
      const backupData: Record<string, any> = {};
      
      caches.forEach(cacheKey => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          backupData[cacheKey] = JSON.parse(cached);
        }
      });
      
      // Save backup with timestamp
      const backup = {
        timestamp: Date.now(),
        data: backupData
      };
      
      localStorage.setItem('traceeye_backup', JSON.stringify(backup));
      
      setIsCreatingBackup(false);
      setBackupMessage({
        type: 'success',
        text: `Backup created successfully! ${Object.keys(backupData).length} items backed up.`
      });
      
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (error) {
      setIsCreatingBackup(false);
      setBackupMessage({
        type: 'error',
        text: 'Failed to create backup. Please try again.'
      });
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  const handleRestoreBackup = () => {
    setIsRestoring(true);
    setBackupMessage(null);
    
    try {
      const backupStr = localStorage.getItem('traceeye_backup');
      if (!backupStr) {
        throw new Error('No backup found');
      }
      
      const backup = JSON.parse(backupStr);
      const backupData = backup.data || {};
      
      // Restore each cache item
      Object.entries(backupData).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      
      setIsRestoring(false);
      setBackupMessage({
        type: 'success',
        text: `Data restored successfully! ${Object.keys(backupData).length} items restored.`
      });
      
      // Refresh cache stats after restore
      setTimeout(() => {
        const caches = ['traceeye_cache_batches', 'traceeye_cache_producers', 'traceeye_cache_handovers', 'traceeye_cache_alerts', 'traceeye_cache_cardVisits'];
        const stats: CacheStats = {};
        
        caches.forEach(cacheKey => {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const data = JSON.parse(cached);
              const keyName = cacheKey.replace('traceeye_cache_', '');
              stats[keyName] = {
                exists: true,
                age: Date.now() - (data.timestamp || Date.now()),
                size: JSON.stringify(data).length
              };
            } else {
              const keyName = cacheKey.replace('traceeye_cache_', '');
              stats[keyName] = { exists: false };
            }
          } catch (error) {
            const keyName = cacheKey.replace('traceeye_cache_', '');
            stats[keyName] = { exists: false, error: 'Parse error' };
          }
        });
        
        setCacheStats(stats);
      }, 500);
      
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (error) {
      setIsRestoring(false);
      setBackupMessage({
        type: 'error',
        text: 'Failed to restore backup. No backup found or corrupted.'
      });
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  const handleClearCache = () => {
    try {
      const caches = ['traceeye_cache_batches', 'traceeye_cache_producers', 'traceeye_cache_handovers', 'traceeye_cache_alerts', 'traceeye_cache_cardVisits'];
      
      caches.forEach(cacheKey => {
        localStorage.removeItem(cacheKey);
      });
      
      setCacheStats({
        batches: { exists: false },
        producers: { exists: false },
        handovers: { exists: false },
        alerts: { exists: false },
        cardVisits: { exists: false }
      });
      
      setBackupMessage({
        type: 'success',
        text: 'Cache cleared successfully!'
      });
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: 'Failed to clear cache. Please try again.'
      });
      setTimeout(() => setBackupMessage(null), 3000);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCacheAge = (ms?: number) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Don't show system status panel if user is not authenticated
  if (!isUserAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Status Indicator Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all ${
          healthStatus?.database === 'healthy' 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
            : healthStatus?.database === 'degraded'
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-rose-500 text-white hover:bg-rose-600'
        }`}
      >
        {healthStatus && getStatusIcon(healthStatus.database)}
        <span className="text-sm font-bold">
          {healthStatus?.database === 'healthy' ? 'System Healthy' : 
           healthStatus?.database === 'degraded' ? 'System Degraded' : 'System Down'}
        </span>
        <Activity size={16} className="animate-pulse" />
      </button>

      {/* Detailed Panel */}
      {showDetails && (
        <div className="absolute bottom-16 right-0 w-96 rounded-2xl border-2 border-slate-200 bg-white shadow-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Server size={20} className="text-emerald-600" />
              System Status
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <CloseIcon size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Health Status */}
          {healthStatus && (
            <div className="mb-4 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">Database Status</span>
                <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(healthStatus.database)}`}>
                  {getStatusIcon(healthStatus.database)}
                  {healthStatus.database.charAt(0).toUpperCase() + healthStatus.database.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={12} />
                  <span>Uptime: {formatUptime(healthStatus.databaseUptime)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Wifi size={12} />
                  <span>Errors: {healthStatus.errorCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="mb-4 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">Cache Status</span>
                <span className="text-xs text-slate-500">
                  {Object.values(cacheStats).filter(s => s.exists).length} items cached
                </span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(cacheStats).map(([key, stat]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      {stat.exists ? (
                        <>
                          <span className="text-emerald-600 font-medium">{formatCacheAge(stat.age)}</span>
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400">Not cached</span>
                          <XCircle size={12} className="text-slate-300" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup/Restore Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating Backup...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Create Backup</span>
                </>
              )}
            </button>

            <button
              onClick={handleRestoreBackup}
              disabled={isRestoring}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRestoring ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Restore from Backup</span>
                </>
              )}
            </button>

            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <HardDrive size={16} />
              <span>Clear Cache</span>
            </button>
          </div>

          {/* Message Display */}
          {backupMessage && (
            <div className={`mt-4 rounded-xl p-3 text-center text-sm font-bold ${
              backupMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {backupMessage.type === 'success' ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{backupMessage.text}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{backupMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Info Text */}
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <p>
                Automatic fallback to cached data when database is unavailable. 
                Regular backups ensure data recovery during system failures.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}