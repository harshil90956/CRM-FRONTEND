import { Mail, Phone, Building, Calendar, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { LeadDb } from "@/api/services/leads.service";
import { format } from "date-fns";

interface LeadCardProps {
  lead: LeadDb & {
    assignedTo?: string | null;
    project?: { name: string } | null;
    assignedToUser?: { name: string } | null;
  };
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
  variant?: 'small' | 'large';
  onViewDetails?: () => void;
  onEdit?: () => void;
  onCall?: () => void;
  onDelete?: () => void;
}

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: "bg-blue-50 text-blue-600 border-blue-200",
    CONTACTED: "bg-purple-50 text-purple-600 border-purple-200",
    FOLLOWUP: "bg-yellow-50 text-yellow-600 border-yellow-200",
    QUALIFIED: "bg-green-50 text-green-600 border-green-200",
    NEGOTIATION: "bg-orange-50 text-orange-600 border-orange-200",
    CONVERTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    LOST: "bg-red-50 text-red-600 border-red-200",
  };
  return styles[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

const getPriorityStyle = (priority: string) => {
  const styles: Record<string, string> = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-yellow-50 text-yellow-600",
    Low: "bg-green-50 text-green-600",
  };
  return styles[priority] || "bg-gray-50 text-gray-600";
};

export const LeadCard = ({
  lead,
  selected,
  onSelect,
  onClick,
  variant = 'small',
  onViewDetails,
  onEdit,
  onCall,
  onDelete,
}: LeadCardProps) => {
  const isLarge = variant === 'large';

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={onSelect} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{lead.name}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs border", getStatusStyle(lead.status))}>
            {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem
                onClick={() => {
                  onViewDetails?.();
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!onEdit}
                onClick={() => {
                  onEdit?.();
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onCall?.();
                }}
              >
                Call
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                disabled={!onDelete}
                onClick={() => {
                  onDelete?.();
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-3 h-3" />
          <span>{lead.phone}</span>
        </div>
        {isLarge && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="w-3 h-3" />
            <span>{(lead.project as any)?.name || lead.projectId || 'N/A'}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {lead.priority && (
            <Badge variant="secondary" className={cn("text-xs", getPriorityStyle(lead.priority))}>
              {lead.priority}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs font-normal">
            {lead.source}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {format(new Date(lead.createdAt), 'MMM d, yyyy')}
        </div>
      </div>

      {isLarge && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">{lead.budget || 'N/A'}</span>
          </div>
          {(lead.assignedTo || (lead as any).assignedToUser) && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Assigned:</span>
              <span className="font-medium">{lead.assignedTo || (lead as any).assignedToUser?.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
