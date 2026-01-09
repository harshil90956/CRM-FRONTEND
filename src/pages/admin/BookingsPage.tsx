import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { IndianRupee, Clock, CheckCircle, Search, Filter, CreditCard, FileText, Download } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookingCard } from "@/components/booking/BookingCard";
import { BookingDetailSheet } from "@/components/booking/BookingDetailSheet";
import { Booking } from "@/data/mockData";
import { bookingsService, paymentsService } from "@/api";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/unitHelpers";
import { computeAdminBookingsMetrics } from "@/lib/bookingMetrics";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

type PaymentMethod = 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'RTGS' | 'Card' | 'Net Banking' | 'Online';

const toPaymentMethodEnum = (method: PaymentMethod) => {
  const map: Record<PaymentMethod, any> = {
    'Bank Transfer': 'Bank_Transfer',
    'Net Banking': 'Net_Banking',
    'UPI': 'UPI',
    'Cash': 'Cash',
    'Cheque': 'Cheque',
    'RTGS': 'RTGS',
    'Card': 'Card',
    'Online': 'Online',
  };
  return map[method];
};

export const AdminBookingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    mode: 'Bank Transfer' as PaymentMethod,
    remarks: '',
  });

  const loadBookings = async () => {
    const res = await bookingsService.list();
    setBookings(((res as any)?.data ?? []) as Booking[]);
  };

  const loadPayments = async () => {
    const res = await paymentsService.list();
    setPayments(((res as any)?.data ?? []) as any[]);
  };

  useEffect(() => {
    loadBookings();
    loadPayments();
  }, []);

  const metrics = computeAdminBookingsMetrics(bookings, payments);

  const paymentPending = metrics.paymentPendingBookings;
  const completed = metrics.completedBookings;
  const cancelled = metrics.cancelledBookings;

  const totalRevenue = metrics.totalRevenue;
  const pendingRevenue = metrics.pendingRevenue;

  const handleRecordPayment = async () => {
    if (!selectedBooking) return;
    
    setLoading(true);
    try {
      await paymentsService.create({
        bookingId: selectedBooking.id,
        customerId: selectedBooking.customerId,
        unitId: selectedBooking.unitId,
        tenantId: (selectedBooking as any).tenantId,
        amount: Number(paymentForm.amount) || selectedBooking.tokenAmount,
        status: 'Received',
        method: toPaymentMethodEnum(paymentForm.mode),
        paidAt: new Date().toISOString(),
        notes: paymentForm.remarks,
        paymentType: 'Booking',
      } as any);

      const paymentsRes = await paymentsService.list();
      const nextPayments = (((paymentsRes as any)?.data ?? []) as any[]);
      setPayments(nextPayments);

      const bookingMetrics = computeAdminBookingsMetrics([selectedBooking], nextPayments);
      const remaining = bookingMetrics.remainingAmountByBookingId.get(String(selectedBooking.id)) ?? 0;

      await bookingsService.updateStatus(selectedBooking.id, {
        status: remaining === 0 ? 'BOOKED' : 'PAYMENT_PENDING',
      } as any);

      toast({ title: "Payment Recorded", description: `Payment recorded for ${selectedBooking.unitNo}` });
      setPaymentModalOpen(false);
      setPaymentForm({ amount: '', mode: 'Bank Transfer', remarks: '' });
      await loadBookings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const handleOpenPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentForm({
      amount: String(booking.tokenAmount),
      mode: 'Bank Transfer',
      remarks: '',
    });
    setPaymentModalOpen(true);
  };

  const handleDownloadReceipt = (_booking: Booking) => {
    toast({ title: 'Disabled', description: 'Receipt download is disabled until backend receipt API exists.', variant: 'destructive' });
  };

  const getPaidAmount = (bookingId: string) => metrics.paidAmountByBookingId.get(String(bookingId)) ?? 0;
  const getRemainingAmount = (bookingId: string) => metrics.remainingAmountByBookingId.get(String(bookingId)) ?? 0;
  const hasTokenButNoPayment = (b: Booking) => (Number((b as any)?.tokenAmount) || 0) > 0 && getPaidAmount(b.id) === 0;

  const searchLower = (search ?? '').toLowerCase();
  const filteredPending = paymentPending.filter(b => 
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const { page: pendingPage, setPage: setPendingPage, totalPages: pendingTotalPages, pageItems: paginatedPending } = useClientPagination(filteredPending, { pageSize: 10 });
  const { page: completedPage, setPage: setCompletedPage, totalPages: completedTotalPages, pageItems: paginatedCompleted } = useClientPagination(completed, { pageSize: 10 });
  const { page: cancelledPage, setPage: setCancelledPage, totalPages: cancelledTotalPages, pageItems: paginatedCancelled } = useClientPagination(cancelled, { pageSize: 10 });
  const { page: allPage, setPage: setAllPage, totalPages: allTotalPages, pageItems: paginatedAll } = useClientPagination(bookings, { pageSize: 10 });

  useEffect(() => {
    setPendingPage(1);
  }, [search, setPendingPage]);

  return (
    <PageWrapper
      title="Booking & Payments"
      description="Record payments and complete bookings."
      sidebarCollapsed={sidebarCollapsed}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Payment Pending" value={paymentPending.length} icon={Clock} iconColor="text-warning" delay={0} />
        <KPICard title="Completed Bookings" value={completed.length} icon={CheckCircle} iconColor="text-success" delay={0.1} />
        <KPICard title="Total Revenue" value={formatPrice(totalRevenue)} icon={IndianRupee} iconColor="text-primary" delay={0.2} />
        <KPICard title="Pending Revenue" value={formatPrice(pendingRevenue)} icon={CreditCard} iconColor="text-info" delay={0.3} />
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="pending">Payment Pending ({paymentPending.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-0 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search bookings..." className="pl-9 w-full sm:w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {filteredPending.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-success/30 mb-4" />
              <h3 className="font-semibold mb-2">All Payments Recorded</h3>
              <p className="text-muted-foreground">No pending payments at the moment</p>
            </Card>
          ) : (
            paginatedPending.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={{ ...booking, status: 'PAYMENT_PENDING' } as any}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
                showActions
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {hasTokenButNoPayment(booking) && (
                      <Badge variant="destructive" className="text-xs">
                        Token not recorded in payments
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Paid: {formatPrice(getPaidAmount(booking.id))}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Remaining: {formatPrice(getRemainingAmount(booking.id))}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(booking); }}
                    >
                      <CreditCard className="w-4 h-4 mr-1" /> Record Payment
                    </Button>
                  </div>
                }
              />
            ))
          )}

          <PaginationBar page={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} className="px-0" />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {paginatedCompleted.map((booking, index) => (
            <BookingCard
              key={booking.id}
              booking={{ ...booking, status: 'BOOKED' } as any}
              onClick={() => handleViewDetails(booking)}
              delay={index * 0.05}
              showActions
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {hasTokenButNoPayment(booking) && (
                    <Badge variant="destructive" className="text-xs">
                      Token not recorded in payments
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Paid: {formatPrice(getPaidAmount(booking.id))}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Remaining: {formatPrice(getRemainingAmount(booking.id))}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(booking); }}
                  >
                    <Download className="w-4 h-4 mr-1" /> Receipt
                  </Button>
                </div>
              }
            />
          ))}

          <PaginationBar page={completedPage} totalPages={completedTotalPages} onPageChange={setCompletedPage} className="px-0" />
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {paginatedCancelled.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No Cancelled Bookings</h3>
              <p className="text-muted-foreground">Cancelled/refunded bookings will appear here</p>
            </Card>
          ) : (
            paginatedCancelled.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
              />
            ))
          )}

          <PaginationBar page={cancelledPage} totalPages={cancelledTotalPages} onPageChange={setCancelledPage} className="px-0" />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {paginatedAll.map((booking, index) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => handleViewDetails(booking)}
              delay={index * 0.05}
            />
          ))}

          <PaginationBar page={allPage} totalPages={allTotalPages} onPageChange={setAllPage} className="px-0" />
        </TabsContent>
      </Tabs>

      {/* Payment Recording Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for {selectedBooking?.unitNo} - {selectedBooking?.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">{selectedBooking?.unitNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Price</span>
                <span className="font-semibold">{formatPrice(selectedBooking?.totalPrice || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Paid</span>
                <span className="font-medium text-success">{formatPrice(selectedBooking?.tokenAmount || 0)}</span>
              </div>
            </div>

            <div>
              <Label>Payment Amount</Label>
              <Input 
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label>Payment Mode</Label>
              <Select 
                value={paymentForm.mode} 
                onValueChange={(v) => setPaymentForm({ ...paymentForm, mode: v as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Net Banking">Net Banking</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea 
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button variant="outline" className="w-full sm:flex-1" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full sm:flex-1" onClick={handleRecordPayment} disabled={loading}>
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={selectedBooking}
        role="admin"
        onRefresh={loadBookings}
      />
    </PageWrapper>
  );
};
