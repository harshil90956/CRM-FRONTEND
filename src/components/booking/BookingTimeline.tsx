import { motion } from "framer-motion";
import { Check, Clock, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_STEPS, BookingStatus } from "@/data/mockData";

interface BookingTimelineProps {
  status: BookingStatus;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const BookingTimeline = ({ status, className, orientation = 'horizontal' }: BookingTimelineProps) => {
  const currentIndex = BOOKING_STEPS.findIndex(step => step.key === status);
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';

  const getStepIcon = (index: number) => {
    if (isCancelled) return <AlertCircle className="w-4 h-4" />;
    if (index < currentIndex) return <Check className="w-4 h-4" />;
    if (index === currentIndex) return <Clock className="w-4 h-4" />;
    return <Circle className="w-4 h-4" />;
  };

  const getStepStyle = (index: number) => {
    if (isCancelled) return "bg-destructive text-destructive-foreground";
    if (index < currentIndex) return "bg-success text-success-foreground";
    if (index === currentIndex) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn("flex flex-col gap-0", className)}>
        {BOOKING_STEPS.map((step, index) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                getStepStyle(index)
              )}>
                {getStepIcon(index)}
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div className={cn(
                  "w-0.5 h-12 transition-colors",
                  index < currentIndex ? "bg-success" : "bg-muted"
                )} />
              )}
            </div>
            <div className="pb-8">
              <p className={cn(
                "font-medium text-sm",
                index <= currentIndex ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex items-center justify-between min-w-[600px] py-4">
        {BOOKING_STEPS.map((step, index) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center flex-1"
          >
            <div className="flex items-center w-full">
              {index > 0 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-colors",
                  index <= currentIndex ? "bg-success" : "bg-muted"
                )} />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
                getStepStyle(index)
              )}>
                {getStepIcon(index)}
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-colors",
                  index < currentIndex ? "bg-success" : "bg-muted"
                )} />
              )}
            </div>
            <p className={cn(
              "text-xs font-medium mt-2 text-center",
              index <= currentIndex ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
