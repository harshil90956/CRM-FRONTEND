import { useEffect, useState, useCallback } from "react";
import { Download, Phone, Mail, MessageSquare, Calendar, User, Building2, IndianRupee, Send, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingTimeline } from "./BookingTimeline";
import { Booking, CommunicationLog, Payment, communicationLogs } from "@/data/mockData";
import { formatPrice } from "@/lib/unitHelpers";
import { mockApi } from "@/lib/mockApi";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  role: 'admin' | 'manager' | 'agent' | 'customer';
  onRefresh?: () => void;
}

export const BookingDetailSheet = ({ open, onOpenChange, booking, role, onRefresh }: BookingDetailSheetProps) => {
  const [newLogType, setNewLogType] = useState<CommunicationLog['type']>('Call');
  const [newLogMessage, setNewLogMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadPayments = useCallback(async (bookingId: string) => {
    const data = await mockApi.get<Payment[]>('/payments');
    const filtered = data
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPayments(filtered);
  }, []);

  useEffect(() => {
    if (open && booking?.id) {
      loadPayments(booking.id);
    }
  }, [open, booking?.id, loadPayments]);

  if (!booking) return null;

  const logs = communicationLogs.filter(log => log.bookingId === booking.id);

  const handleAddLog = async () => {
    if (!newLogMessage.trim()) return;
    
    // Simulate adding communication log
    const newLog = {
      id: `comm_${Date.now()}`,
      bookingId: booking.id,
      type: newLogType,
      message: newLogMessage,
      createdBy: 'current_user',
      createdByName: 'You',
      createdAt: new Date().toISOString(),
    };
    
    communicationLogs.push(newLog);
    setNewLogMessage('');
    toast({ title: "Log Added", description: "Communication log has been added." });
    onRefresh?.();
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (booking.status === 'HOLD_REQUESTED' && (role === 'admin' || role === 'manager')) {
        await mockApi.patch('/bookings', booking.id, {
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await mockApi.patch('/units', booking.unitId, {
          status: 'HOLD',
          updatedAt: new Date().toISOString(),
        });
        toast({ title: "Approved", description: "Hold request approved. Unit is now on HOLD." });
        onRefresh?.();
        onOpenChange(false);
        return;
      }

      await mockApi.patch('/bookings', booking.id, { 
        status: role === 'manager' ? 'BOOKING_CONFIRMED' : 'BOOKED',
        ...(role === 'manager' && { 
          managerApprovedAt: new Date().toISOString(),
          managerId: 'u_mgr_1',
          managerName: 'Current Manager'
        })
      });
      toast({ title: "Approved", description: role === 'manager' ? "Booking has been approved" : "Payment recorded successfully" });
      onRefresh?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (booking.status === 'HOLD_REQUESTED' && (role === 'admin' || role === 'manager')) {
        await mockApi.patch('/bookings', booking.id, {
          status: 'REJECTED',
          rejectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await mockApi.patch('/units', booking.unitId, { status: 'AVAILABLE', updatedAt: new Date().toISOString() });
        toast({ title: "Rejected", description: "Hold request rejected. Unit remains AVAILABLE." });
        onRefresh?.();
        onOpenChange(false);
        return;
      }

      await mockApi.patch('/bookings', booking.id, { status: 'CANCELLED' });
      toast({ title: "Rejected", description: "Booking has been rejected" });
      onRefresh?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    mockApi.downloadReceipt(booking.status === 'BOOKED' ? 'booking' : 'token', booking);
  };

  const handleDownloadPaymentReceipt = (payment: Payment) => {
    mockApi.downloadReceipt('payment', payment);
  };


  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Required', description: 'Please enter cancellation reason', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await mockApi.patch('/bookings', booking.id, {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancelReason,
        updatedAt: new Date().toISOString(),
      });
      await mockApi.patch('/units', booking.unitId, { status: 'AVAILABLE', updatedAt: new Date().toISOString() });
      toast({ title: 'Cancelled', description: 'Your booking has been cancelled.' });
      setCancelDialogOpen(false);
      setCancelReason('');
      onRefresh?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel booking', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Meeting': return <Calendar className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const canApprove = (role === 'manager' || role === 'admin') && booking.status === 'HOLD_REQUESTED';
  const canCancel = role === 'customer' && !['BOOKED', 'CANCELLED', 'REFUNDED'].includes(booking.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
          <SheetDescription>Booking ID: {booking.id}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="mt-4 space-y-6">
              {/* Unit Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Property Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Unit</p>
                    <p className="font-medium">{booking.unitNo}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Project</p>
                    <p className="font-medium">{booking.projectName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customerPhone}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Financial Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Token Amount</p>
                    <p className="font-semibold text-primary">{formatPrice(booking.tokenAmount)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Total Price</p>
                    <p className="font-semibold">{formatPrice(booking.totalPrice)}</p>
                  </div>
                </div>
              </div>

              {booking.agentName && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Assigned Agent</p>
                    <p className="font-medium">{booking.agentName}</p>
                  </div>
                </>
              )}

              {booking.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <BookingTimeline status={booking.status} orientation="vertical" />
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-4">
              {payments.length === 0 ? (
                <div className="p-6 border rounded-lg text-center text-sm text-muted-foreground">
                  No payments recorded for this booking yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{p.type}</Badge>
                            <Badge variant={p.status === 'Received' ? 'default' : p.status === 'Refunded' ? 'secondary' : 'outline'} className="text-xs">
                              {p.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(p.date).toLocaleString()} • {p.method}
                          </p>
                          {p.receiptNo && (
                            <p className="text-xs text-muted-foreground mt-1">Receipt: {p.receiptNo}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-primary">{formatPrice(p.amount)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => handleDownloadPaymentReceipt(p)}
                          >
                            <Download className="w-4 h-4 mr-2" /> Receipt
                          </Button>
                        </div>
                      </div>

                      {p.notes && (
                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="mt-1">{p.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs" className="mt-4 space-y-4">
              {(role === 'agent' || role === 'manager') && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex gap-2">
                    <Select value={newLogType} onValueChange={(v) => setNewLogType(v as CommunicationLog['type'])}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea 
                    placeholder="Add communication notes..." 
                    value={newLogMessage}
                    onChange={(e) => setNewLogMessage(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddLog} disabled={!newLogMessage.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Add Log
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No communication logs yet</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-3 p-3 border rounded-lg">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        log.type === 'Call' ? 'bg-primary/10 text-primary' :
                        log.type === 'WhatsApp' ? 'bg-success/10 text-success' :
                        log.type === 'Email' ? 'bg-info/10 text-info' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{log.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">by {log.createdByName}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
            <Download className="w-4 h-4 mr-2" /> Download Receipt
          </Button>
          {role === 'customer' && (
            <>
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </>
          )}
          {canApprove && (
            <>
              <Button variant="destructive" onClick={handleReject} disabled={loading}>
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                <Check className="w-4 h-4 mr-2" /> 
                Approve
              </Button>
            </>
          )}
        </div>

        {/* Customer: Cancel Booking Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Tell us why you want to cancel. This will release the unit.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Enter cancellation reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={loading}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleCancelBooking} disabled={loading}>
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
