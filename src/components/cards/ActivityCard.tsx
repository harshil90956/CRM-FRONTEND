import { motion } from "framer-motion";
import { Phone, Calendar, FileText, Mail, CreditCard } from "lucide-react";
import { activities } from "@/data/mockData";
import { cn } from "@/lib/utils";

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    call: Phone,
    meeting: Calendar,
    note: FileText,
    email: Mail,
    booking: CreditCard,
  };
  return icons[type] || FileText;
};

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    call: "bg-info/10 text-info",
    meeting: "bg-success/10 text-success",
    note: "bg-warning/10 text-warning",
    email: "bg-primary/10 text-primary",
    booking: "bg-chart-4/10 text-chart-4",
  };
  return colors[type] || "bg-muted text-muted-foreground";
};

export const ActivityCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest team actions</p>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  getActivityColor(activity.type)
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.agent}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
