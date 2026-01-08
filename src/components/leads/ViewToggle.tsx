import { List, LayoutGrid, Calendar, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = 'list' | 'grid-small' | 'grid-large' | 'calendar';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export const ViewToggle = ({ value, onChange }: ViewToggleProps) => {
  const options: { mode: ViewMode; icon: React.ReactNode }[] = [
    { mode: 'list', icon: <List className="w-4 h-4" /> },
    { mode: 'grid-small', icon: <Grid3X3 className="w-4 h-4" /> },
    { mode: 'grid-large', icon: <LayoutGrid className="w-4 h-4" /> },
    { mode: 'calendar', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="flex border border-border rounded-lg overflow-hidden bg-background">
      {options.map(({ mode, icon }, index) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={cn(
            "p-2 transition-all relative flex items-center justify-center",
            index < options.length - 1 && "border-r border-border",
            value === mode
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {icon}
          {value === mode && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
};
