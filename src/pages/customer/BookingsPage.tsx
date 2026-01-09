import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/booking/BookingCard";
import { BookingDetailSheet } from "@/components/booking/BookingDetailSheet";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { Booking } from "@/data/mockData";
import { bookingsService } from "@/api";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useAppStore } from "@/stores/appStore";

export const CustomerBookingsPage = () => {
  const { currentUser } = useAppStore();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const customerId = currentUser?.id;

  const loadBookings = async () => {
    const res = await bookingsService.list();
    setBookings(((res as any)?.data ?? []) as Booking[]);
  };

  useEffect(() => {
    loadBookings();
  }, [customerId]);

  const myBookings = customerId ? bookings.filter((b) => b.customerId === customerId) : [];

  const isCancelRequested = (b: Booking) => {
    const raw = typeof (b as any)?.managerNotes === 'string' ? String((b as any).managerNotes) : '';
    return b.status === 'BOOKING_PENDING_APPROVAL' && raw.startsWith('CANCEL_REQUESTED|');
  };

  const activeBookings = myBookings.filter(b => !['BOOKED', 'CANCELLED', 'REFUNDED'].includes(b.status));
  const completedBookings = myBookings.filter(b => b.status === 'BOOKED');
  const cancelledBookings = myBookings.filter(b => ['CANCELLED', 'REFUNDED'].includes(b.status));

  const { page: activePage, setPage: setActivePage, totalPages: activeTotalPages, pageItems: paginatedActive } = useClientPagination(activeBookings, { pageSize: 10 });
  const { page: completedPage, setPage: setCompletedPage, totalPages: completedTotalPages, pageItems: paginatedCompleted } = useClientPagination(completedBookings, { pageSize: 10 });
  const { page: cancelledPage, setPage: setCancelledPage, totalPages: cancelledTotalPages, pageItems: paginatedCancelled } = useClientPagination(cancelledBookings, { pageSize: 10 });

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/customer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">RealCRM Properties</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/customer/properties" className="text-sm text-muted-foreground hover:text-foreground">Properties</Link>
            <Link to="/customer/projects" className="text-sm text-muted-foreground hover:text-foreground">Projects</Link>
            <Link to="/customer/bookings" className="text-sm font-medium text-primary">My Bookings</Link>
            <Link to="/customer/payments" className="text-sm text-muted-foreground hover:text-foreground">Payments</Link>
            <Link to="/customer/profile" className="text-sm text-muted-foreground hover:text-foreground">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Track and manage your property bookings</p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-2">No Active Bookings</h3>
                <p className="text-muted-foreground mb-4">You don't have any active bookings yet</p>
                <Link to="/customer/properties">
                  <Button>Browse Properties</Button>
                </Link>
              </Card>
            ) : (
              paginatedActive.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold">{booking.unitNo}</h3>
                        <p className="text-muted-foreground">{booking.projectName}</p>
                      </div>
                      <Button variant="outline" onClick={() => handleViewDetails(booking)}>
                        <Download className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </div>
                    <BookingTimeline status={booking.status} className="mb-4" />
                    <p className="text-sm text-muted-foreground text-center">
                      Your booking is currently at:{' '}
                      <span className="font-medium text-primary">
                        {isCancelRequested(booking) ? 'Cancel Requested' : booking.status.replace(/_/g, ' ')}
                      </span>
                    </p>
                  </Card>
                </motion.div>
              ))
            )}

            <PaginationBar page={activePage} totalPages={activeTotalPages} onPageChange={setActivePage} className="px-0" />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-2">No Completed Bookings</h3>
                <p className="text-muted-foreground">Your completed bookings will appear here</p>
              </Card>
            ) : (
              paginatedCompleted.map((booking, index) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onClick={() => handleViewDetails(booking)}
                  delay={index * 0.1}
                />
              ))
            )}

            <PaginationBar page={completedPage} totalPages={completedTotalPages} onPageChange={setCompletedPage} className="px-0" />
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-2">No Cancelled Bookings</h3>
                <p className="text-muted-foreground">Your cancelled bookings will appear here</p>
              </Card>
            ) : (
              paginatedCancelled.map((booking, index) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onClick={() => handleViewDetails(booking)}
                  delay={index * 0.1}
                />
              ))
            )}

            <PaginationBar page={cancelledPage} totalPages={cancelledTotalPages} onPageChange={setCancelledPage} className="px-0" />
          </TabsContent>
        </Tabs>
      </main>

      {selectedBooking && (
        <BookingDetailSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setSelectedBooking(null);
          }}
          booking={selectedBooking}
          role="customer"
          onRefresh={loadBookings}
        />
      )}
    </div>
  );
};
