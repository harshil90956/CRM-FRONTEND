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
import { Booking, BookingStatus, bookings as defaultBookings } from "@/data/mockData";
import { mockApi } from "@/lib/mockApi";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

type PaymentMethod = 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'RTGS' | 'Card' | 'Net Banking' | 'Online';

export const AdminBookingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>(defaultBookings);
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
    const data = await mockApi.get<Booking[]>('/bookings');
    setBookings(data);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const paymentPendingStatuses: BookingStatus[] = [
    'PAYMENT_PENDING',
    'BOOKING_CONFIRMED',
    'HOLD_CONFIRMED',
  ];

  const paymentPending = bookings.filter((b) => paymentPendingStatuses.includes(b.status));
  const completed = bookings.filter(b => b.status === 'BOOKED');
  const totalRevenue = completed.reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingRevenue = paymentPending.reduce((sum, b) => sum + b.totalPrice, 0);

  const handleRecordPayment = async () => {
    if (!selectedBooking) return;
    
    setLoading(true);
    try {
      // Record payment
      await mockApi.recordPayment({
        customerId: selectedBooking.customerId,
        customerName: selectedBooking.customerName,
        unitId: selectedBooking.unitId,
        unitNo: selectedBooking.unitNo,
        bookingId: selectedBooking.id,
        amount: Number(paymentForm.amount) || selectedBooking.tokenAmount,
        type: 'Booking',
        method: paymentForm.mode,
        date: new Date().toISOString(),
        status: 'Received',
        notes: paymentForm.remarks,
        tenantId: selectedBooking.tenantId,
      });

      // Update booking status
      await mockApi.patch('/bookings', selectedBooking.id, {
        status: 'BOOKED',
        bookedAt: new Date().toISOString(),
        paymentMode: paymentForm.mode,
        paymentRecordedAt: new Date().toISOString(),
        paymentRemarks: paymentForm.remarks,
      });

      // Update unit status
      await mockApi.patch('/units', selectedBooking.unitId, { status: 'SOLD' });

      toast({ title: "Payment Recorded", description: `Booking for ${selectedBooking.unitNo} is now complete` });
      setPaymentModalOpen(false);
      setPaymentForm({ amount: '', mode: 'Bank Transfer', remarks: '' });
      loadBookings();
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

  const handleDownloadReceipt = (booking: Booking) => {
    mockApi.downloadReceipt('booking', booking);
  };

  const filteredPending = paymentPending.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.unitNo.toLowerCase().includes(search.toLowerCase())
  );

  const { page: pendingPage, setPage: setPendingPage, totalPages: pendingTotalPages, pageItems: paginatedPending } = useClientPagination(filteredPending, { pageSize: 10 });
  const { page: completedPage, setPage: setCompletedPage, totalPages: completedTotalPages, pageItems: paginatedCompleted } = useClientPagination(completed, { pageSize: 10 });
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
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
                showActions
                actions={
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(booking); }}
                  >
                    <CreditCard className="w-4 h-4 mr-1" /> Record Payment
                  </Button>
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
              booking={booking}
              onClick={() => handleViewDetails(booking)}
              delay={index * 0.05}
              showActions
              actions={
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(booking); }}
                >
                  <Download className="w-4 h-4 mr-1" /> Receipt
                </Button>
              }
            />
          ))}

          <PaginationBar page={completedPage} totalPages={completedTotalPages} onPageChange={setCompletedPage} className="px-0" />
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
