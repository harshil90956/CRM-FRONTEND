import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveMetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  badge?: string;
  badgeType?: 'warning' | 'info' | 'success' | 'error';
  delay?: number;
}

export const LiveMetricsCard = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = "text-primary",
  badge,
  badgeType = 'info',
  delay = 0,
}: LiveMetricsCardProps) => {
  const badgeColors = {
    warning: 'text-warning',
    info: 'text-info',
    success: 'text-success',
    error: 'text-destructive',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-1",
            changeType === 'positive' && "text-success",
            changeType === 'negative' && "text-destructive",
            changeType === 'neutral' && "text-muted-foreground"
          )}>
            {changeType === 'positive' && <TrendingUp className="w-3 h-3" />}
            {changeType === 'negative' && <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
        {badge && (
          <span className={cn("text-xs font-medium flex items-center gap-1", badgeColors[badgeType])}>
            {badgeType === 'warning' && <AlertCircle className="w-3 h-3" />}
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className={cn(
        "text-2xl font-bold",
        changeType === 'positive' && "text-success",
        changeType === 'negative' && "text-destructive",
        changeType === 'neutral' && "text-foreground"
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
};
