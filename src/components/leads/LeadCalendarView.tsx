import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadDb } from "@/api/services/leads.service";

 type LeadCalendarItem = Omit<LeadDb, 'assignedTo'> & { assignedTo?: string | null };

interface LeadCalendarViewProps {
  leads: LeadCalendarItem[];
  onLeadClick: (lead: LeadCalendarItem) => void;
}

export const LeadCalendarView = ({ leads, onLeadClick }: LeadCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const leadsByDate = useMemo(() => {
    const map = new Map<string, LeadCalendarItem[]>();
    leads.forEach(lead => {
      const dateKey = format(new Date(lead.createdAt), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(lead);
    });
    return map;
  }, [leads]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0 border-border">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayLeads = leadsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-r border-b last:border-r-0 border-border",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 mb-1 rounded-full text-sm",
                isCurrentDay && "bg-primary text-primary-foreground",
                !isCurrentMonth && "text-muted-foreground"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayLeads.slice(0, 3).map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => onLeadClick(lead)}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                      lead.status === 'NEW' && "bg-blue-100 text-blue-700",
                      lead.status === 'CONTACTED' && "bg-purple-100 text-purple-700",
                      lead.status === 'QUALIFIED' && "bg-green-100 text-green-700",
                      lead.status === 'CONVERTED' && "bg-emerald-100 text-emerald-700",
                      lead.status === 'LOST' && "bg-red-100 text-red-700",
                      !['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].includes(lead.status) && "bg-gray-100 text-gray-700"
                    )}
                  >
                    {lead.name}
                  </div>
                ))}
                {dayLeads.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dayLeads.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
