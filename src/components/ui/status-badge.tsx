import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  // Booking/Lead Status
  'PENDING': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'HOLD_REQUESTED': { label: 'Hold Requested', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  'HOLD_CONFIRMED': { label: 'Hold Confirmed', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'APPROVED': { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
  'REJECTED': { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
  'BOOKED': { label: 'Booked', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'CANCELLED': { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  'REFUNDED': { label: 'Refunded', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  
  // Unit Status
  'AVAILABLE': { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
  'HOLD': { label: 'On Hold', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  'SOLD': { label: 'Sold', className: 'bg-red-100 text-red-800 border-red-200' },
  
  // Priority
  'High': { label: 'High', className: 'bg-red-100 text-red-800 border-red-200' },
  'Medium': { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'Low': { label: 'Low', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  
  // Default
  'default': { label: 'Unknown', className: 'bg-gray-100 text-gray-800 border-gray-200' }
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.default;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
