import { useState, useEffect } from 'react';
import { Header } from '@/components/Common/Header';
import { checkHealth } from '@/services/api';
import { wsService } from '@/services/websocket';
import { User, Bell, Palette, Database, Shield, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  displayName: string;
  email: string;
  role: string;
}

interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  alertSeverity: 'all' | 'high' | 'critical';
  digestFrequency: 'realtime' | 'hourly' | 'daily';
}

const Settings = () => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'integrations'>('profile');
  const { toast } = useToast();

  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: 'Security Admin',
    email: 'admin@cyberdefense.local',
    role: 'Administrator',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    alertSeverity: 'high',
    digestFrequency: 'realtime',
  });

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

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Header isHealthy={isHealthy} isConnected={isConnected} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="glass-card p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors">
                      Change Avatar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={userSettings.displayName}
                        onChange={(e) =>
                          setUserSettings((prev) => ({ ...prev, displayName: e.target.value }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) =>
                          setUserSettings((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Role
                      </label>
                      <input
                        type="text"
                        value={userSettings.role}
                        disabled
                        className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <h4 className="font-medium">Email Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via email
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          emailAlerts: !prev.emailAlerts,
                        }))
                      }
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors",
                        notifications.emailAlerts ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform",
                          notifications.emailAlerts ? "translate-x-6" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          pushNotifications: !prev.pushNotifications,
                        }))
                      }
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors",
                        notifications.pushNotifications ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform",
                          notifications.pushNotifications ? "translate-x-6" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Alert Severity Threshold
                    </label>
                    <select
                      value={notifications.alertSeverity}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          alertSeverity: e.target.value as NotificationSettings['alertSeverity'],
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="all">All alerts</option>
                      <option value="high">High and Critical only</option>
                      <option value="critical">Critical only</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Digest Frequency
                    </label>
                    <select
                      value={notifications.digestFrequency}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          digestFrequency: e.target.value as NotificationSettings['digestFrequency'],
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly digest</option>
                      <option value="daily">Daily digest</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Palette className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Appearance</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Theme</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="p-4 rounded-lg border-2 border-primary bg-card text-left">
                        <div className="w-full h-20 rounded bg-background mb-3 flex items-center justify-center">
                          <div className="w-8 h-8 rounded bg-primary/20" />
                        </div>
                        <span className="font-medium">Dark (Default)</span>
                      </button>
                      <button className="p-4 rounded-lg border border-border bg-card text-left opacity-50 cursor-not-allowed">
                        <div className="w-full h-20 rounded bg-gray-100 mb-3 flex items-center justify-center">
                          <div className="w-8 h-8 rounded bg-blue-500/20" />
                        </div>
                        <span className="font-medium">Light (Coming Soon)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Integrations</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Elasticsearch</h4>
                        <p className="text-sm text-muted-foreground">localhost:9200</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-online" />
                      <span className="text-sm text-success">Connected</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Kibana</h4>
                        <p className="text-sm text-muted-foreground">localhost:5601</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-online" />
                      <span className="text-sm text-success">Connected</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">🐍</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Flask Backend</h4>
                        <p className="text-sm text-muted-foreground">localhost:5000</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={isHealthy ? "status-online" : "status-offline"} />
                      <span className={cn("text-sm", isHealthy ? "text-success" : "text-destructive")}>
                        {isHealthy ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
