import { motion } from "framer-motion";
import { Calendar, User, MapPin, IndianRupee, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus } from "@/data/mockData";
import { formatPrice } from "@/lib/unitHelpers";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  showActions?: boolean;
  actions?: React.ReactNode;
  delay?: number;
}

const getStatusConfig = (status: BookingStatus) => {
  const configs: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
    'HOLD_REQUESTED': { label: 'Hold Requested', color: 'text-warning', bgColor: 'bg-warning/10' },
    'HOLD_CONFIRMED': { label: 'Hold Confirmed', color: 'text-info', bgColor: 'bg-info/10' },
    'BOOKING_PENDING_APPROVAL': { label: 'Pending Approval', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'BOOKING_CONFIRMED': { label: 'Booking Confirmed', color: 'text-primary', bgColor: 'bg-primary/10' },
    'PAYMENT_PENDING': { label: 'Payment Pending', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'BOOKED': { label: 'Booked', color: 'text-success', bgColor: 'bg-success/10' },
    'CANCELLED': { label: 'Cancelled', color: 'text-destructive', bgColor: 'bg-destructive/10' },
    'REFUNDED': { label: 'Refunded', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  };
  return configs[status] || configs['HOLD_REQUESTED'];
};

const isCancelRequested = (booking: Booking) => {
  const raw = typeof (booking as any)?.managerNotes === 'string' ? String((booking as any).managerNotes) : '';
  return booking.status === 'BOOKING_PENDING_APPROVAL' && raw.startsWith('CANCEL_REQUESTED|');
};

export const BookingCard = ({ booking, onClick, showActions, actions, delay = 0 }: BookingCardProps) => {
  const statusConfig = isCancelRequested(booking)
    ? { label: 'Cancel Requested', color: 'text-destructive', bgColor: 'bg-destructive/10' }
    : getStatusConfig(booking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card 
        className={cn(
          "p-4 hover:shadow-md transition-all cursor-pointer",
          onClick && "hover:border-primary/50"
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{booking.unitNo}</h4>
            <p className="text-sm text-muted-foreground">{booking.projectName}</p>
          </div>
          <Badge className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="truncate">{booking.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IndianRupee className="w-4 h-4" />
            <span>Token: {formatPrice(booking.tokenAmount)}</span>
          </div>
          {booking.holdExpiresAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Expires: {new Date(booking.holdExpiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-primary">{formatPrice(booking.totalPrice)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 min-w-0">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{booking.projectName || '—'}</span>
            </div>
          </div>
          {showActions && actions ? (
            <div className="flex flex-wrap gap-2 justify-end">{actions}</div>
          ) : (
            <Button variant="ghost" size="sm">
              View Details <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
