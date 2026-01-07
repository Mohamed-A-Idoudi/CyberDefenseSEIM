import { useDashboard } from '@/hooks/useDashboard';
import { Header } from '@/components/Common/Header';
import { KPICard } from '@/components/Widgets/KPICard';
import { LogsTable } from '@/components/Logs/LogsTable';
import { FileUpload } from '@/components/Upload/FileUpload';
import { KibanaEmbed } from '@/components/Dashboard/KibanaEmbed';
import { FileText, ShieldAlert, Ban, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { logs, stats, isHealthy, isLoading, isConnected, refreshLogs } = useDashboard();

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Header isHealthy={isHealthy} isConnected={isConnected} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time security monitoring and threat detection
          </p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Logs (Today)"
            value={stats.totalLogs}
            icon={FileText}
            trend={{ value: 12, isPositive: true }}
            variant="default"
          />
          <KPICard
            title="Failed Logins (24h)"
            value={stats.failedLogins}
            icon={ShieldAlert}
            trend={{ value: 5, isPositive: false }}
            variant="danger"
          />
          <KPICard
            title="Blocked IPs"
            value={stats.blockedIPs}
            icon={Ban}
            variant="warning"
          />
          <KPICard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            variant={stats.activeAlerts > 0 ? 'danger' : 'success'}
          />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Logs Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <LogsTable logs={logs} isLoading={isLoading} maxRows={8} />
            <div className="mt-4 flex justify-end">
              <Link
                to="/logs"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all logs
                <TrendingUp className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* File Upload */}
          <div className="lg:col-span-1">
            <FileUpload onUploadSuccess={refreshLogs} />
            
            {/* Quick Stats */}
            <div className="glass-card p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Backend API</span>
                  <div className="flex items-center gap-2">
                    <div className={isHealthy ? "status-online" : "status-offline"} />
                    <span className="text-sm font-mono">
                      {isHealthy ? 'Healthy' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">WebSocket</span>
                  <div className="flex items-center gap-2">
                    <div className={isConnected ? "status-online" : "status-offline"} />
                    <span className="text-sm font-mono">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Update</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    Just now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kibana Embed */}
        <section>
          <KibanaEmbed />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 CyberDefense SIEM. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
