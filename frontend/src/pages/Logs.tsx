import { useState, useEffect } from 'react';
import { Header } from '@/components/Common/Header';
import { LogsTable } from '@/components/Logs/LogsTable';
import { KibanaEmbed } from '@/components/Dashboard/KibanaEmbed';
import { getLatestLogs, searchLogs, checkHealth, LogEntry } from '@/services/api';
import { wsService } from '@/services/websocket';
import { Search, Filter, Download, RefreshCw, Calendar, Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';


interface IPOption {
  ip: string;
  count: number;
}

interface EventOption {
  event: string;
  count: number;
  severity?: string;
}


const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [searchIP, setSearchIP] = useState('');
  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dropdown options
  const [ipOptions, setIpOptions] = useState<IPOption[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);


  // Fetch IP and Event options
  const fetchFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      console.log("📥 Fetching filter options...");
      
      const [ipsRes, eventsRes] = await Promise.all([
        fetch('http://localhost:5000/api/logs/unique-ips').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        fetch('http://localhost:5000/api/logs/unique-events').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
      ]);
      
      console.log("✅ IPs loaded:", ipsRes.ips?.length || 0);
      console.log("✅ Events loaded:", eventsRes.events?.length || 0);
      
      setIpOptions(ipsRes.ips || []);
      setEventOptions(eventsRes.events || []);
    } catch (error) {
      console.error('❌ Failed to fetch filter options:', error);
      setIpOptions([]);
      setEventOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };


  // Fetch logs with filters
  const fetchLogsWithFilters = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await searchLogs({
        ip: searchIP || undefined,
        event: eventType || undefined,
        start_date: dateFrom || undefined,
        end_date: dateTo || undefined,
        page,
      });
      setLogs(response.logs || []);
      setTotalLogs(response.total || response.logs?.length || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to search logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [health, logsResponse] = await Promise.all([
          checkHealth(),
          getLatestLogs(),
        ]);
        setIsHealthy(health.status === 'healthy');
        setLogs(logsResponse.logs || []);
        setTotalLogs(logsResponse.total || logsResponse.logs?.length || 0);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchFilterOptions();

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


  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await getLatestLogs();
      setLogs(response.logs || []);
      setTotalLogs(response.total || response.logs?.length || 0);
      
      // Also refresh the dropdown options
      await fetchFilterOptions();
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
      ...logs.map((log) =>
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
    setCurrentPage(1);
  };


  const hasActiveFilters = searchIP || eventType || dateFrom || dateTo;

  // Get severity badge color
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-700';
      case 'high':
        return 'bg-orange-500/20 text-orange-700';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700';
      default:
        return 'bg-green-500/20 text-green-700';
    }
  };


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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* IP Address Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                IP Address ({ipOptions.length})
              </label>
              <div className="relative">
                <select
                  value={searchIP}
                  onChange={(e) => setSearchIP(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">All IP addresses</option>
                  {loadingOptions ? (
                    <option disabled>Loading...</option>
                  ) : ipOptions.length > 0 ? (
                    ipOptions.map((item) => (
                      <option key={item.ip} value={item.ip}>
                        {item.ip} ({item.count} logs)
                      </option>
                    ))
                  ) : (
                    <option disabled>No IPs found</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Event Type Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Event Type ({eventOptions.length})
              </label>
              <div className="relative">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">All events</option>
                  {loadingOptions ? (
                    <option disabled>Loading...</option>
                  ) : eventOptions.length > 0 ? (
                    eventOptions.map((item) => (
                      <option key={item.event} value={item.event}>
                        {item.event.replace(/_/g, ' ')} - {item.severity?.toUpperCase()} ({item.count} logs)
                      </option>
                    ))
                  ) : (
                    <option disabled>No events found</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
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

          {/* Search Button */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => fetchLogsWithFilters(1)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              Search Logs
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-mono text-foreground">{logs.length}</span> of{' '}
            <span className="font-mono text-foreground">{totalLogs}</span> logs
          </p>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Logs Table */}
        <div className="mb-8">
          <LogsTable logs={logs} isLoading={isLoading} maxRows={20} />
        </div>

        {/* Kibana Embed */}
        <KibanaEmbed title="Kibana Log Analysis" />
      </main>
    </div>
  );
};


export default Logs;
