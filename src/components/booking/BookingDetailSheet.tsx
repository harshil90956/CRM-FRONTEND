import { useEffect, useState, useCallback } from "react";
import { Download, Phone, Mail, User, Building2, IndianRupee, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingTimeline } from "./BookingTimeline";
import { Booking, Payment } from "@/data/mockData";
import { formatPrice } from "@/lib/unitHelpers";
import { bookingsService, paymentsService } from "@/api";
import { toast } from "@/hooks/use-toast";
import { PaymentDetailDrawer } from "@/components/payments/PaymentDetailDrawer";
import { useNavigate } from "react-router-dom";

interface BookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  role: 'admin' | 'manager' | 'agent' | 'customer';
  onRefresh?: () => void;
}

export const BookingDetailSheet = ({ open, onOpenChange, booking, role, onRefresh }: BookingDetailSheetProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'payments'>('details');

  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<Array<{ key: string; at: string }> | null>(null);

  const [rejectHoldDialogOpen, setRejectHoldDialogOpen] = useState(false);
  const [rejectHoldReason, setRejectHoldReason] = useState('');

  const [rejectBookingDialogOpen, setRejectBookingDialogOpen] = useState(false);
  const [rejectBookingReason, setRejectBookingReason] = useState('');

  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentDrawerId, setPaymentDrawerId] = useState<string | null>(null);

  const loadPayments = useCallback(async (bookingId: string) => {
    const res = await paymentsService.list();
    const list = ((res as any)?.data ?? []) as any[];
    const filtered = list
      .filter((p) => p.bookingId === bookingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const normalized = filtered.map((p) => ({
      ...p,
      displayDate: p.paidAt ?? p.createdAt,
      paymentType: p.paymentType ?? '',
    }));
    setPayments(normalized);
  }, []);

  const openPayment = (paymentId: string) => {
    setPaymentDrawerId(paymentId);
    setPaymentDrawerOpen(true);
  };

  useEffect(() => {
    if (open && booking?.id) {
      loadPayments(booking.id);
    }
  }, [open, booking?.id, loadPayments]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!open || !booking?.id) return;
      if (activeTab !== 'timeline') return;

      setTimelineLoading(true);
      setTimelineEvents(null);
      try {
        const res = await bookingsService.timeline(booking.id);
        const data = ((res as any)?.data ?? null) as any;
        setTimelineEvents(Array.isArray(data?.events) ? data.events : []);
      } catch {
        toast({ title: 'Error', description: 'Failed to load timeline', variant: 'destructive' });
        setTimelineEvents([]);
      } finally {
        setTimelineLoading(false);
      }
    };
    loadTimeline();
  }, [activeTab, booking?.id, open]);

  if (!booking) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (booking.status === 'HOLD_REQUESTED' && (role === 'admin' || role === 'manager')) {
        await bookingsService.approveHold(booking.id, {
          status: 'HOLD_CONFIRMED',
          approvedAt: new Date().toISOString(),
        } as any);
        toast({ title: "Approved", description: "Hold request approved." });
        onRefresh?.();
        onOpenChange(false);
        return;
      }

      await bookingsService.approve(booking.id, {
        status: role === 'manager' ? 'BOOKING_CONFIRMED' : 'BOOKED',
        approvedAt: new Date().toISOString(),
      } as any);

      toast({ title: "Approved", description: role === 'manager' ? "Booking has been approved" : "Booking marked as booked" });
      onRefresh?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (role !== 'admin' && role !== 'manager') return;

    if (booking.status === 'HOLD_REQUESTED') {
      setRejectHoldDialogOpen(true);
      return;
    }

    if (booking.status === 'BOOKING_PENDING_APPROVAL') {
      setRejectBookingDialogOpen(true);
    }
  };

  const handleDownloadReceipt = () => {
    toast({ title: 'Disabled', description: 'Receipt download is disabled until a real backend receipt API exists.', variant: 'destructive' });
  };

  const handleDownloadPaymentReceipt = (payment: Payment) => {
    toast({ title: 'Disabled', description: 'Receipt download is disabled until a real backend receipt API exists.', variant: 'destructive' });
  };


  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Required', description: 'Please enter cancellation reason', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await bookingsService.cancel(booking.id, {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancelReason.trim(),
      } as any);

      toast({ title: 'Cancelled', description: 'Booking cancelled successfully.' });
      setCancelDialogOpen(false);
      setCancelReason('');
      onRefresh?.();
      onOpenChange(false);
      if (role === 'customer') {
        navigate('/customer/properties');
      }
    } catch (error) {
      try {
        await bookingsService.updateStatus(booking.id, {
          status: 'BOOKING_PENDING_APPROVAL',
          cancellationReason: cancelReason.trim(),
          managerNotes: `CANCEL_REQUESTED|${booking.status}`,
        } as any);
        toast({ title: 'Requested', description: 'Cancellation request sent for approval.' });
        setCancelDialogOpen(false);
        setCancelReason('');
        onRefresh?.();
        onOpenChange(false);
      } catch {
        toast({ title: 'Error', description: 'Failed to cancel booking', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getCancelRequestMeta = () => {
    const raw = typeof (booking as any)?.managerNotes === 'string' ? String((booking as any).managerNotes) : '';
    if (!raw.startsWith('CANCEL_REQUESTED|')) return null;
    const originalStatus = raw.split('|')[1] || '';
    return { originalStatus };
  };

  const cancelRequestMeta = getCancelRequestMeta();

  const handleApproveCancelRequest = async () => {
    if (!cancelRequestMeta) return;
    const reason = typeof (booking as any)?.cancellationReason === 'string' ? String((booking as any).cancellationReason) : '';
    if (!reason.trim()) {
      toast({ title: 'Required', description: 'Cancellation reason is missing', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await bookingsService.cancel(booking.id, {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason.trim(),
      } as any);
      toast({ title: 'Cancelled', description: 'Cancellation request approved.' });
      onRefresh?.();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to approve cancellation', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCancelRequest = async () => {
    if (!cancelRequestMeta) return;
    if (!cancelRequestMeta.originalStatus) {
      toast({ title: 'Error', description: 'Original status missing', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await bookingsService.updateStatus(booking.id, {
        status: cancelRequestMeta.originalStatus as any,
        cancellationReason: undefined,
        managerNotes: undefined,
      } as any);
      toast({ title: 'Rejected', description: 'Cancellation request rejected.' });
      onRefresh?.();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to reject cancellation request', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const canApprove = (role === 'manager' || role === 'admin') && booking.status === 'HOLD_REQUESTED';
  const canRejectHold = (role === 'manager' || role === 'admin') && booking.status === 'HOLD_REQUESTED';
  const canRejectBooking = (role === 'manager' || role === 'admin') && booking.status === 'BOOKING_PENDING_APPROVAL';
  const canApproveBooking = (role === 'manager' || role === 'admin') && booking.status === 'BOOKING_PENDING_APPROVAL';
  const canCancel =
    role === 'customer' &&
    ['HOLD_REQUESTED', 'HOLD_CONFIRMED', 'BOOKING_PENDING_APPROVAL', 'PAYMENT_PENDING'].includes(booking.status) &&
    !cancelRequestMeta;

  const canApproveCancelRequest =
    (role === 'manager' || role === 'admin') && booking.status === 'BOOKING_PENDING_APPROVAL' && Boolean(cancelRequestMeta);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
          <SheetDescription>Booking ID: {booking.id}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden" onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
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
              {timelineLoading ? (
                <div className="p-6 border rounded-lg text-center text-sm text-muted-foreground">Loading timeline...</div>
              ) : !timelineEvents ? (
                <div className="p-6 border rounded-lg text-center text-sm text-muted-foreground">Select a booking to view timeline.</div>
              ) : timelineEvents.length === 0 ? (
                <div className="p-6 border rounded-lg text-center text-sm text-muted-foreground">No timeline events yet.</div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents
                    .slice()
                    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
                    .map((e, idx) => (
                      <div key={`${e.key}-${e.at}-${idx}`} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-sm">{String(e.key).replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-4">
              {payments.length === 0 ? (
                <div className="p-6 border rounded-lg text-center text-sm text-muted-foreground">
                  No payments recorded for this booking yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 border rounded-lg cursor-pointer"
                      onClick={() => (role === 'admin' || role === 'manager' ? openPayment(p.id) : undefined)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{p.paymentType}</Badge>
                            <Badge
                              variant={
                                p.status === 'Received'
                                  ? 'default'
                                  : p.status === 'Refunded'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                            >
                              {p.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {p.displayDate ? new Date(p.displayDate).toLocaleDateString() : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPaymentReceipt(p);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" /> Receipt
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <X className="w-4 h-4 mr-2" /> Request Cancel
                </Button>
              )}
            </>
          )}
          {canApprove && (
            <>
              {canRejectHold && (
                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  <X className="w-4 h-4 mr-2" /> Reject Hold
                </Button>
              )}
              <Button onClick={handleApprove} disabled={loading}>
                <Check className="w-4 h-4 mr-2" /> 
                Approve
              </Button>
            </>
          )}

          {canApproveCancelRequest ? (
            <>
              <Button variant="destructive" onClick={handleRejectCancelRequest} disabled={loading}>
                <X className="w-4 h-4 mr-2" /> Reject Cancel
              </Button>
              <Button onClick={handleApproveCancelRequest} disabled={loading}>
                <Check className="w-4 h-4 mr-2" /> Approve Cancel
              </Button>
            </>
          ) : (
            (canRejectBooking || canApproveBooking) && (
              <>
                {canRejectBooking && (
                  <Button variant="destructive" onClick={handleReject} disabled={loading}>
                    <X className="w-4 h-4 mr-2" /> Reject Booking
                  </Button>
                )}
                {canApproveBooking && (
                  <Button onClick={handleApprove} disabled={loading}>
                    <Check className="w-4 h-4 mr-2" /> Approve Booking
                  </Button>
                )}
              </>
            )
          )}
        </div>

        {/* Customer: Cancel Booking Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Cancellation</DialogTitle>
              <DialogDescription>
                Tell us why you want to cancel. This will be sent for approval.
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
                {loading ? 'Requesting...' : 'Confirm Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectHoldDialogOpen} onOpenChange={setRejectHoldDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Hold Request</DialogTitle>
              <DialogDescription>
                Provide a reason. This will cancel the hold request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Enter rejection reason"
                value={rejectHoldReason}
                onChange={(e) => setRejectHoldReason(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectHoldDialogOpen(false)} disabled={loading}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!rejectHoldReason.trim()) {
                    toast({ title: 'Required', description: 'Rejection reason is required', variant: 'destructive' });
                    return;
                  }
                  setLoading(true);
                  try {
                    await bookingsService.rejectHold(booking.id, {
                      status: 'CANCELLED',
                      cancelledAt: new Date().toISOString(),
                      cancellationReason: rejectHoldReason.trim(),
                    } as any);
                    toast({ title: 'Rejected', description: 'Hold request rejected.' });
                    setRejectHoldDialogOpen(false);
                    setRejectHoldReason('');
                    onRefresh?.();
                    onOpenChange(false);
                  } catch {
                    toast({ title: 'Error', description: 'Failed to reject hold request', variant: 'destructive' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectBookingDialogOpen} onOpenChange={setRejectBookingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Booking</DialogTitle>
              <DialogDescription>
                Confirm rejecting this booking request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Enter rejection reason (optional)"
                value={rejectBookingReason}
                onChange={(e) => setRejectBookingReason(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectBookingDialogOpen(false)} disabled={loading}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await bookingsService.reject(booking.id, {
                      status: 'CANCELLED',
                      rejectedAt: new Date().toISOString(),
                      cancellationReason: rejectBookingReason.trim() || undefined,
                    } as any);
                    toast({ title: 'Rejected', description: 'Booking rejected.' });
                    setRejectBookingDialogOpen(false);
                    setRejectBookingReason('');
                    onRefresh?.();
                    onOpenChange(false);
                  } catch {
                    toast({ title: 'Error', description: 'Failed to reject booking', variant: 'destructive' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Confirm Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PaymentDetailDrawer
          open={paymentDrawerOpen}
          onOpenChange={setPaymentDrawerOpen}
          paymentId={paymentDrawerId}
          role={role}
          onUpdated={async () => {
            if (booking?.id) await loadPayments(booking.id);
          }}
        />
      </SheetContent>
    </Sheet>
  );
};
