import { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DatePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom' | 'all';

interface DateRangePickerProps {
  onDateChange: (range: { from: Date | null; to: Date | null; preset: DatePreset }) => void;
  className?: string;
}

export const DateRangePicker = ({ onDateChange, className }: DateRangePickerProps) => {
  const [preset, setPreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const presetLabels: Record<DatePreset, string> = {
    all: 'All Time',
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    custom: 'Custom Range',
  };

  const handlePresetSelect = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const now = new Date();
    
    let from: Date | null = null;
    let to: Date | null = null;

    switch (newPreset) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'yesterday':
        from = startOfDay(subDays(now, 1));
        to = endOfDay(subDays(now, 1));
        break;
      case 'last7':
        from = startOfDay(subDays(now, 7));
        to = endOfDay(now);
        break;
      case 'last30':
        from = startOfDay(subDays(now, 30));
        to = endOfDay(now);
        break;
      case 'custom':
        setIsCalendarOpen(true);
        return;
      case 'all':
      default:
        break;
    }

    onDateChange({ from, to, preset: newPreset });
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      onDateChange({ from: customFrom, to: customTo, preset: 'custom' });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 min-w-[130px]">
            <CalendarIcon className="w-4 h-4" />
            {presetLabels[preset]}
            <ChevronDown className="w-3 h-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover">
          <DropdownMenuItem onClick={() => handlePresetSelect('all')}>
            All Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('today')}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('yesterday')}>
            Yesterday
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('last7')}>
            Last 7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('last30')}>
            Last 30 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetSelect('custom')}>
            Custom Range...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Popover */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              preset === 'custom' && customFrom && customTo ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {preset === 'custom' && customFrom && customTo
              ? `${format(customFrom, 'MMM d')} - ${format(customTo, 'MMM d, yyyy')}`
              : 'Pick a date range'
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 border-b sm:border-b-0 sm:border-r">
              <p className="text-sm font-medium mb-2">From</p>
              <Calendar
                mode="single"
                selected={customFrom}
                onSelect={setCustomFrom}
                className="pointer-events-auto"
                disabled={(date) => customTo ? date > customTo : false}
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium mb-2">To</p>
              <Calendar
                mode="single"
                selected={customTo}
                onSelect={setCustomTo}
                className="pointer-events-auto"
                disabled={(date) => customFrom ? date < customFrom : false}
              />
            </div>
          </div>
          <div className="p-3 border-t flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setIsCalendarOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="w-full sm:w-auto" onClick={handleCustomRange} disabled={!customFrom || !customTo}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
