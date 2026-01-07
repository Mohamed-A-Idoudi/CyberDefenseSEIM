export const KIBANA_URL = import.meta.env.VITE_KIBANA_URL || 'http://localhost:5601';
export const KIBANA_DISCOVER_PATH = '/app/discover';
export const KIBANA_DASHBOARD_PATH = '/app/dashboards';

export const REFRESH_INTERVALS = {
  LOGS: 10000, // 10 seconds
  STATS: 30000, // 30 seconds
  HEALTH: 60000, // 1 minute
};

export const SEVERITY_COLORS = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-orange-500',
  critical: 'text-destructive',
} as const;

export const SEVERITY_BADGES = {
  low: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
} as const;

export const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'ACCESS_DENIED',
  'FILE_ACCESS',
  'NETWORK_CONNECTION',
  'FIREWALL_BLOCK',
  'MALWARE_DETECTED',
  'SUSPICIOUS_ACTIVITY',
  'SYSTEM_ERROR',
] as const;

export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { name: 'Logs', path: '/logs', icon: 'ScrollText' },
  { name: 'Alerts', path: '/alerts', icon: 'Bell' },
  { name: 'Settings', path: '/settings', icon: 'Settings' },
] as const;
