import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  bgColor?: string;
  delay?: number;
}

export const SummaryKPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  bgColor = "bg-primary/5",
  delay = 0,
}: SummaryKPICardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn("rounded-xl p-5 relative overflow-hidden", bgColor)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground/80">{title}</p>
          <p className="text-2xl font-bold mt-1 text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-success" />
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/50">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};
