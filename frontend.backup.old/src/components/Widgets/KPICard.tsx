import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  suffix?: string;
}

export function KPICard({ title, value, icon: Icon, trend, variant = 'default', suffix }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
        setIsAnimating(false);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const variantStyles = {
    default: 'border-border/50 hover:border-primary/50',
    success: 'border-success/30 hover:border-success/50',
    warning: 'border-warning/30 hover:border-warning/50',
    danger: 'border-destructive/30 hover:border-destructive/50',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-destructive bg-destructive/10',
  };

  const glowStyles = {
    default: 'group-hover:cyber-glow',
    success: 'group-hover:cyber-glow-success',
    warning: '',
    danger: 'group-hover:cyber-glow-danger',
  };

  return (
    <div
      className={cn(
        "group glass-card p-6 transition-all duration-300 cursor-default",
        variantStyles[variant],
        glowStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-3xl font-bold font-mono tracking-tight",
                isAnimating && "animate-count-up"
              )}
            >
              {displayValue.toLocaleString()}
            </span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last hour</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default KPICard;
