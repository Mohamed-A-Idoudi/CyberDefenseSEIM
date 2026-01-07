import { useState, useEffect } from 'react';
import { Header } from '@/components/Common/Header';
import { checkHealth } from '@/services/api';
import { wsService } from '@/services/websocket';
import { Bell, Plus, Trash2, Edit2, Check, X, AlertTriangle, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEVERITY_BADGES } from '@/utils/constants';

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: string;
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

const mockRules: AlertRule[] = [
  {
    id: '1',
    name: 'Failed Login Threshold',
    condition: 'More than 5 failed logins from same IP in 5 minutes',
    severity: 'high',
    enabled: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Malware Detection',
    condition: 'Any malware signature detected',
    severity: 'critical',
    enabled: true,
    createdAt: '2024-01-14T08:30:00Z',
  },
  {
    id: '3',
    name: 'Unusual Network Traffic',
    condition: 'Outbound traffic exceeds 1GB in 1 hour',
    severity: 'medium',
    enabled: false,
    createdAt: '2024-01-13T15:00:00Z',
  },
];

const mockAlerts: Alert[] = [
  {
    id: 'a1',
    ruleId: '1',
    ruleName: 'Failed Login Threshold',
    message: '8 failed login attempts from IP 192.168.1.105',
    severity: 'high',
    timestamp: '2024-01-16T14:30:00Z',
    acknowledged: false,
  },
  {
    id: 'a2',
    ruleId: '2',
    ruleName: 'Malware Detection',
    message: 'Trojan signature detected in uploaded file',
    severity: 'critical',
    timestamp: '2024-01-16T13:45:00Z',
    acknowledged: true,
  },
];

const Alerts = () => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'rules' | 'history'>('active');
  const [rules, setRules] = useState<AlertRule[]>(mockRules);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const health = await checkHealth();
        setIsHealthy(health.status === 'healthy');
      } catch {
        setIsHealthy(false);
      }
    };

    init();
    wsService.connect();
    
    const unsubConnection = wsService.subscribe('connection_status', ({ connected }) => {
      setIsConnected(connected);
    });

    return () => {
      unsubConnection();
    };
  }, []);

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Header isHealthy={isHealthy} isConnected={isConnected} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Alerts</h1>
            <p className="text-muted-foreground">
              Manage alert rules and view active alerts
            </p>
          </div>
          <button
            onClick={() => setShowNewRuleForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6">
          {[
            { id: 'active', label: 'Active Alerts', count: activeAlerts.length },
            { id: 'rules', label: 'Alert Rules', count: rules.length },
            { id: 'history', label: 'History', count: acknowledgedAlerts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded text-xs",
                activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Active Alerts Tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active alerts</h3>
                <p className="text-muted-foreground">
                  All systems operating normally
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "glass-card p-4 border-l-4 animate-fade-in",
                    alert.severity === 'critical' && "border-l-destructive",
                    alert.severity === 'high' && "border-l-orange-500",
                    alert.severity === 'medium' && "border-l-warning",
                    alert.severity === 'low' && "border-l-success"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        alert.severity === 'critical' && "bg-destructive/20",
                        alert.severity === 'high' && "bg-orange-500/20",
                        alert.severity === 'medium' && "bg-warning/20",
                        alert.severity === 'low' && "bg-success/20"
                      )}>
                        <AlertTriangle className={cn(
                          "h-5 w-5",
                          alert.severity === 'critical' && "text-destructive",
                          alert.severity === 'high' && "text-orange-500",
                          alert.severity === 'medium' && "text-warning",
                          alert.severity === 'low' && "text-success"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.ruleName}</h4>
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
                            SEVERITY_BADGES[alert.severity]
                          )}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors",
                        rule.enabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform",
                        rule.enabled ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full border capitalize",
                          SEVERITY_BADGES[rule.severity]
                        )}>
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rule.condition}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {acknowledgedAlerts.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alert history</h3>
                <p className="text-muted-foreground">
                  Acknowledged alerts will appear here
                </p>
              </div>
            ) : (
              acknowledgedAlerts.map((alert) => (
                <div key={alert.id} className="glass-card p-4 opacity-70">
                  <div className="flex items-start gap-4">
                    <Check className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">{alert.ruleName}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Alerts;
