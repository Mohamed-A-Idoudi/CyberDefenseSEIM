import { useState, useEffect, useCallback } from 'react';
import { getLatestLogs, checkHealth, LogEntry } from '@/services/api';
import { wsService } from '@/services/websocket';
import { REFRESH_INTERVALS } from '@/utils/constants';

interface DashboardStats {
  totalLogs: number;
  failedLogins: number;
  blockedIPs: number;
  activeAlerts: number;
}

interface UseDashboardReturn {
  logs: LogEntry[];
  stats: DashboardStats;
  isHealthy: boolean;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLogs: 0,
    failedLogins: 0,
    blockedIPs: 0,
    activeAlerts: 0,
  });
  const [isHealthy, setIsHealthy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((logEntries: LogEntry[]) => {
    const failedLogins = logEntries.filter(
      (log) => log.event?.toLowerCase().includes('failed') || log.event?.toLowerCase().includes('denied')
    ).length;

    const uniqueBlockedIPs = new Set(
      logEntries
        .filter((log) => log.event?.toLowerCase().includes('block'))
        .map((log) => log.ip)
    ).size;

    const activeAlerts = logEntries.filter(
      (log) => log.severity === 'high' || log.severity === 'critical'
    ).length;

    setStats({
      totalLogs: logEntries.length,
      failedLogins,
      blockedIPs: uniqueBlockedIPs,
      activeAlerts,
    });
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      setError(null);
      const response = await getLatestLogs();
      const logEntries = response.logs || [];
      setLogs(logEntries);
      calculateStats(logEntries);
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    }
  }, [calculateStats]);

  const checkBackendHealth = useCallback(async () => {
    try {
      const health = await checkHealth();
      setIsHealthy(health.status === 'healthy');
    } catch {
      setIsHealthy(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([checkBackendHealth(), refreshLogs()]);
      setIsLoading(false);
    };

    init();

    // Connect WebSocket
    wsService.connect();

    // Subscribe to updates
    const unsubNewLog = wsService.subscribe('new_log', (log: LogEntry) => {
      setLogs((prev) => [log, ...prev.slice(0, 99)]);
    });

    const unsubConnection = wsService.subscribe('connection_status', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubStats = wsService.subscribe('stats_update', (newStats: DashboardStats) => {
      setStats(newStats);
    });

    // Auto-refresh logs
    const logsInterval = setInterval(refreshLogs, REFRESH_INTERVALS.LOGS);
    const healthInterval = setInterval(checkBackendHealth, REFRESH_INTERVALS.HEALTH);

    return () => {
      clearInterval(logsInterval);
      clearInterval(healthInterval);
      unsubNewLog();
      unsubConnection();
      unsubStats();
    };
  }, [refreshLogs, checkBackendHealth]);

  return {
    logs,
    stats,
    isHealthy,
    isLoading,
    isConnected,
    error,
    refreshLogs,
  };
}

export default useDashboard;
