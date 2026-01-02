import { Shield, Wifi, WifiOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/utils/constants';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isHealthy: boolean;
  isConnected: boolean;
}

export function Header({ isHealthy, isConnected }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground tracking-tight">
                CyberDefense
              </span>
              <span className="text-xs text-primary font-mono tracking-widest">SIEM</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary cyber-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Backend Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isHealthy ? "status-online" : "status-offline"
              )} />
              <span className="text-xs font-mono text-muted-foreground">
                {isHealthy ? 'API Online' : 'API Offline'}
              </span>
            </div>

            {/* WebSocket Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-success" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
