import { LogEntry } from '@/services/api';
import { cn } from '@/lib/utils';
import { SEVERITY_BADGES } from '@/utils/constants';
import { AlertCircle, Clock, Globe, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LogsTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
  maxRows?: number;
}

export function LogsTable({ logs, isLoading, maxRows = 10 }: LogsTableProps) {
  const displayLogs = maxRows ? logs.slice(0, maxRows) : logs;

  const getSeverityFromEvent = (event: string): LogEntry['severity'] => {
    const lowerEvent = event.toLowerCase();
    if (lowerEvent.includes('critical') || lowerEvent.includes('malware')) return 'critical';
    if (lowerEvent.includes('failed') || lowerEvent.includes('denied') || lowerEvent.includes('block')) return 'high';
    if (lowerEvent.includes('warning') || lowerEvent.includes('suspicious')) return 'medium';
    return 'low';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Logs
          </h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading logs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Logs
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Live</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Timestamp
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  IP Address
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Event
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Severity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {displayLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No logs available
                </td>
              </tr>
            ) : (
              displayLogs.map((log, index) => {
                const severity = log.severity || getSeverityFromEvent(log.event);
                return (
                  <tr
                    key={log.id || index}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-3">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="p-3">
                      <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {log.ip}
                      </code>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-foreground">{log.event}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
                          SEVERITY_BADGES[severity]
                        )}
                      >
                        {severity}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsTable;
