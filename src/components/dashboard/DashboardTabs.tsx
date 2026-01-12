import { TrendingUp, Users, DollarSign, Target, Building2, MessageSquare, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardTab = 
  | 'executive-summary' 
  | 'lead-analytics' 
  | 'sales-revenue' 
  | 'team-performance' 
  | 'properties' 
  | 'communications' 
  | 'tasks-activity';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'executive-summary', label: 'Executive Summary', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'lead-analytics', label: 'Lead Analytics', icon: <Users className="w-4 h-4" /> },
  { id: 'sales-revenue', label: 'Sales & Revenue', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'team-performance', label: 'Team Performance', icon: <Target className="w-4 h-4" /> },
  { id: 'properties', label: 'Properties', icon: <Building2 className="w-4 h-4" /> },
  { id: 'communications', label: 'Communications', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'tasks-activity', label: 'Tasks & Activity', icon: <CheckSquare className="w-4 h-4" /> },
];

export const DashboardTabs = ({ activeTab, onChange }: DashboardTabsProps) => {
  return (
    <div className="w-full border-b border-border bg-background">
      <div
        className={cn(
          "flex w-full items-center gap-1 py-2 px-4 overflow-x-auto flex-nowrap",
          "[&::-webkit-scrollbar]:hidden"
        )}
        style={{ scrollbarWidth: 'none' as any, msOverflowStyle: 'none' as any }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
