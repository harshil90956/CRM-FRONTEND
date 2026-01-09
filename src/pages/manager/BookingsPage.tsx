import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, Search, Filter, FileText, Check, X } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingCard } from "@/components/booking/BookingCard";
import { BookingDetailSheet } from "@/components/booking/BookingDetailSheet";
import { Booking } from "@/data/mockData";
import { bookingsService } from "@/api";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const ManagerBookingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    const res = await bookingsService.list();
    setBookings(((res as any)?.data ?? []) as Booking[]);
  };

  useEffect(() => {
    loadBookings();
    (async () => {
      try {
        const res = await bookingsService.statuses();
        setStatuses(((res as any)?.data ?? []) as string[]);
      } catch {
        setStatuses([]);
      }
    })();
  }, []);

  const isCancelRequested = (b: Booking) => {
    const raw = typeof (b as any)?.managerNotes === 'string' ? String((b as any).managerNotes) : '';
    return b.status === 'BOOKING_PENDING_APPROVAL' && raw.startsWith('CANCEL_REQUESTED|');
  };

  const pendingApproval = bookings.filter(b => b.status === 'BOOKING_PENDING_APPROVAL');
  const cancelRequests = pendingApproval.filter(isCancelRequested);
  const bookingApprovals = pendingApproval.filter((b) => !isCancelRequested(b));
  const holdRequests = bookings.filter(b => b.status === 'HOLD_REQUESTED' || b.status === 'HOLD_CONFIRMED');
  const confirmedStatuses = statuses.length ? statuses.filter((s) => ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'BOOKED'].includes(s)) : ['BOOKING_CONFIRMED', 'PAYMENT_PENDING', 'BOOKED'];
  const cancelledStatuses = statuses.length ? statuses.filter((s) => ['CANCELLED', 'REFUNDED'].includes(s)) : ['CANCELLED', 'REFUNDED'];
  const confirmed = bookings.filter(b => confirmedStatuses.includes(b.status));
  const cancelled = bookings.filter(b => cancelledStatuses.includes(b.status));

  const handleApprove = async (booking: Booking) => {
    setLoading(true);
    try {
      await bookingsService.approve(booking.id, {
        status: 'BOOKING_CONFIRMED',
        approvedAt: new Date().toISOString(),
      } as any);
      toast({ title: "Approved", description: `Booking for ${booking.unitNo} has been approved` });
      loadBookings();
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve booking", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const searchLower = (search ?? '').toLowerCase();

  const filteredPending = pendingApproval.filter(b => 
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const filteredCancelled = cancelled.filter(b =>
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const filteredHolds = holdRequests.filter(b =>
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const filteredConfirmed = confirmed.filter(b =>
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const filteredAll = bookings.filter(b =>
    (b.customerName ?? '').toLowerCase().includes(searchLower) ||
    (b.unitNo ?? '').toLowerCase().includes(searchLower)
  );

  const { page: pendingPage, setPage: setPendingPage, totalPages: pendingTotalPages, pageItems: paginatedPending } = useClientPagination(filteredPending, { pageSize: 10 });
  const { page: holdsPage, setPage: setHoldsPage, totalPages: holdsTotalPages, pageItems: paginatedHolds } = useClientPagination(filteredHolds, { pageSize: 10 });
  const { page: confirmedPage, setPage: setConfirmedPage, totalPages: confirmedTotalPages, pageItems: paginatedConfirmed } = useClientPagination(filteredConfirmed, { pageSize: 10 });
  const { page: cancelledPage, setPage: setCancelledPage, totalPages: cancelledTotalPages, pageItems: paginatedCancelled } = useClientPagination(filteredCancelled, { pageSize: 10 });
  const { page: allPage, setPage: setAllPage, totalPages: allTotalPages, pageItems: paginatedAll } = useClientPagination(filteredAll, { pageSize: 10 });

  useEffect(() => {
    setPendingPage(1);
    setHoldsPage(1);
    setConfirmedPage(1);
    setCancelledPage(1);
    setAllPage(1);
  }, [search, setPendingPage, setHoldsPage, setConfirmedPage, setCancelledPage, setAllPage]);

  return (
    <PageWrapper
      title="Booking Approvals"
      description="Review and approve booking requests from customers."
      sidebarCollapsed={sidebarCollapsed}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Pending Approval" value={pendingApproval.length} icon={Clock} iconColor="text-warning" delay={0} />
        <KPICard title="Hold Requests" value={holdRequests.length} icon={FileText} iconColor="text-info" delay={0.1} />
        <KPICard title="Confirmed" value={confirmed.length} icon={CheckCircle} iconColor="text-success" delay={0.2} />
        <KPICard title="Cancelled" value={cancelled.length} icon={XCircle} iconColor="text-destructive" delay={0.3} />
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="pending">Pending Approval ({pendingApproval.length})</TabsTrigger>
            <TabsTrigger value="holds">Hold Requests ({holdRequests.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
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
              <h3 className="font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">No pending approvals at the moment</p>
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
                  isCancelRequested(booking) ? (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(booking);
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full sm:w-auto"
                        onClick={(e) => { e.stopPropagation(); handleReject(booking); }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto"
                        onClick={(e) => { e.stopPropagation(); handleApprove(booking); }}
                        disabled={loading}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </>
                  )
                }
              />
            ))
          )}

          <PaginationBar page={pendingPage} totalPages={pendingTotalPages} onPageChange={setPendingPage} className="px-0" />
        </TabsContent>

        <TabsContent value="holds" className="space-y-4">
          {filteredHolds.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No Hold Requests</h3>
              <p className="text-muted-foreground">New hold requests will appear here</p>
            </Card>
          ) : (
            paginatedHolds.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
              />
            ))
          )}

          <PaginationBar page={holdsPage} totalPages={holdsTotalPages} onPageChange={setHoldsPage} className="px-0" />
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {paginatedConfirmed.map((booking, index) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => handleViewDetails(booking)}
              delay={index * 0.05}
            />
          ))}

          <PaginationBar page={confirmedPage} totalPages={confirmedTotalPages} onPageChange={setConfirmedPage} className="px-0" />
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {paginatedCancelled.length === 0 ? (
            <Card className="p-12 text-center">
              <XCircle className="w-12 h-12 mx-auto text-destructive/30 mb-4" />
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

      <BookingDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={selectedBooking}
        role="manager"
        onRefresh={loadBookings}
      />
    </PageWrapper>
  );
};
