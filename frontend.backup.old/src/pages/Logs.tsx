import { useState, useEffect } from 'react';
import { Header } from '@/components/Common/Header';
import { LogsTable } from '@/components/Logs/LogsTable';
import { KibanaEmbed } from '@/components/Dashboard/KibanaEmbed';
import { getLatestLogs, checkHealth, LogEntry } from '@/services/api';
import { wsService } from '@/services/websocket';
import { Search, Filter, Download, RefreshCw, Calendar, Globe } from 'lucide-react';
import { EVENT_TYPES } from '@/utils/constants';
import { cn } from '@/lib/utils';

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Filters
  const [searchIP, setSearchIP] = useState('');
  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [health, logsResponse] = await Promise.all([
          checkHealth(),
          getLatestLogs(),
        ]);
        setIsHealthy(health.status === 'healthy');
        setLogs(logsResponse.logs || []);
        setFilteredLogs(logsResponse.logs || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    wsService.connect();
    const unsubConnection = wsService.subscribe('connection_status', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubNewLog = wsService.subscribe('new_log', (log: LogEntry) => {
      setLogs((prev) => [log, ...prev]);
    });

    return () => {
      unsubConnection();
      unsubNewLog();
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...logs];

    if (searchIP) {
      result = result.filter((log) =>
        log.ip.toLowerCase().includes(searchIP.toLowerCase())
      );
    }

    if (eventType) {
      result = result.filter((log) =>
        log.event.toLowerCase().includes(eventType.toLowerCase())
      );
    }

    if (dateFrom) {
      result = result.filter((log) =>
        new Date(log.timestamp) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      result = result.filter((log) =>
        new Date(log.timestamp) <= new Date(dateTo)
      );
    }

    setFilteredLogs(result);
  }, [logs, searchIP, eventType, dateFrom, dateTo]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await getLatestLogs();
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'IP Address', 'Event', 'Severity'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map((log) =>
        [log.timestamp, log.ip, log.event, log.severity || 'unknown'].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchIP('');
    setEventType('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchIP || eventType || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Header isHealthy={isHealthy} isConnected={isConnected} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Log Explorer</h1>
          <p className="text-muted-foreground">
            Search, filter, and analyze security logs
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* IP Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                IP Address
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchIP}
                  onChange={(e) => setSearchIP(e.target.value)}
                  placeholder="Search by IP..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-mono"
                />
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              >
                <option value="">All events</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From
              </label>
              <input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                To
              </label>
              <input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-mono text-foreground">{filteredLogs.length}</span> of{' '}
            <span className="font-mono text-foreground">{logs.length}</span> logs
          </p>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Logs Table */}
        <div className="mb-8">
          <LogsTable logs={filteredLogs} isLoading={isLoading} maxRows={20} />
        </div>

        {/* Kibana Embed */}
        <KibanaEmbed title="Kibana Log Analysis" />
      </main>
    </div>
  );
};

export default Logs;
