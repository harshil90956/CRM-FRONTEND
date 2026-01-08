import { cn } from "@/lib/utils";

interface CardEnhancedProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const CardEnhanced = ({ className, hover = false, glass = false, ...props }: CardEnhancedProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:-translate-y-1 cursor-pointer",
        glass && "bg-card/80 backdrop-blur-sm border-white/10",
        className
      )}
      {...props}
    />
  );
};
