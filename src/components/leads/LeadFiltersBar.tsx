import { Search, Users, Download, Upload, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker, DatePreset } from "./DateRangePicker";
import { ViewToggle, ViewMode } from "./ViewToggle";

type AgentOption = {
  id: string;
  name: string;
};

interface LeadFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  assignedFilter: string;
  onAssignedChange: (value: string) => void;
  onDateRangeChange: (range: { from: Date | null; to: Date | null; preset: DatePreset }) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  agents: AgentOption[];
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onExportAll: () => void;
  onExportByStatus: (status: string) => void;
  onImport: () => void;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOWUP", label: "Follow Up" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const sourceOptions = [
  { value: "all", label: "All Sources" },
  { value: "Website", label: "Website" },
  { value: "Facebook", label: "Facebook" },
  { value: "Referral", label: "Referral" },
  { value: "Walk_in", label: "Walk-in" },
  { value: "Google_Ads", label: "Google Ads" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Conference", label: "Conference" },
  { value: "Cold_Email", label: "Cold Email" },
  { value: "Unit_Interest", label: "Unit Interest" },
];

export const LeadFiltersBar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  assignedFilter,
  onAssignedChange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  agents,
  totalCount,
  filteredCount,
  selectedCount,
  onExportAll,
  onExportByStatus,
  onImport,
}: LeadFiltersBarProps) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Row 1: Search + Status + Priority */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-0 sm:min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or company..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {priorityOptions.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Date + Source + Assigned */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <DateRangePicker onDateChange={onDateRangeChange} />

        <Select value={sourceFilter} onValueChange={onSourceChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {sourceOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assignedFilter} onValueChange={onAssignedChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Users className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 3: Stats + Actions + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredCount}</span> of {totalCount} leads
          </span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onExportAll}>
            <Download className="w-4 h-4" />
            Export All
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                By Status
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover">
              {statusOptions.slice(1).map((s) => (
                <DropdownMenuItem key={s.value} onClick={() => onExportByStatus(s.value)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-2" onClick={onImport}>
            <Upload className="w-4 h-4" />
            Import
          </Button>

          <div className="hidden sm:block h-6 w-px bg-border mx-1" />

          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>
    </div>
  );
};
