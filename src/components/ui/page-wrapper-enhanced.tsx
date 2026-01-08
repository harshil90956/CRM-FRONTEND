import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageWrapperEnhancedProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const PageWrapperEnhanced = ({ 
  children, 
  title, 
  description, 
  actions, 
  className,
  contentClassName 
}: PageWrapperEnhancedProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("space-y-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
};
