import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export const KPICard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  delay = 0,
}: KPICardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive && <TrendingUp className="w-4 h-4 text-success" />}
              {isNegative && <TrendingDown className="w-4 h-4 text-destructive" />}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center bg-muted",
            iconColor
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
