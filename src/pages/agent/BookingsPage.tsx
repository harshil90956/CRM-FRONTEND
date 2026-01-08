import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FileText, Users, TrendingUp, Clock, Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/booking/BookingCard";
import { BookingDetailSheet } from "@/components/booking/BookingDetailSheet";
import { Booking, bookings as defaultBookings } from "@/data/mockData";
import { mockApi } from "@/lib/mockApi";
import { formatPrice } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const AgentBookingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<Booking[]>(defaultBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Mock agent ID
  const agentId = 'u_agent_1';

  const loadBookings = async () => {
    const data = await mockApi.get<Booking[]>('/bookings');
    setBookings(data);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Filter bookings assigned to this agent
  const myBookings = bookings.filter(b => b.agentId === agentId);
  const inProgress = myBookings.filter(b => !['BOOKED', 'CANCELLED', 'REFUNDED'].includes(b.status));
  const completed = myBookings.filter(b => b.status === 'BOOKED');
  const totalValue = completed.reduce((sum, b) => sum + b.totalPrice, 0);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const filteredBookings = myBookings.filter(b => 
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.unitNo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInProgress = inProgress.filter(b =>
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.unitNo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompleted = completed.filter(b =>
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.unitNo.toLowerCase().includes(search.toLowerCase())
  );

  const { page: allPage, setPage: setAllPage, totalPages: allTotalPages, pageItems: paginatedAll } = useClientPagination(filteredBookings, { pageSize: 10 });
  const { page: progressPage, setPage: setProgressPage, totalPages: progressTotalPages, pageItems: paginatedInProgress } = useClientPagination(filteredInProgress, { pageSize: 10 });
  const { page: completedPage, setPage: setCompletedPage, totalPages: completedTotalPages, pageItems: paginatedCompleted } = useClientPagination(filteredCompleted, { pageSize: 10 });

  useEffect(() => {
    setAllPage(1);
    setProgressPage(1);
    setCompletedPage(1);
  }, [search, setAllPage, setProgressPage, setCompletedPage]);

  return (
    <PageWrapper
      title="My Bookings"
      description="Track bookings from your leads and customers."
      sidebarCollapsed={sidebarCollapsed}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Bookings" value={myBookings.length} icon={FileText} delay={0} />
        <KPICard title="In Progress" value={inProgress.length} icon={Clock} iconColor="text-warning" delay={0.1} />
        <KPICard title="Completed" value={completed.length} icon={Users} iconColor="text-success" delay={0.2} />
        <KPICard title="Total Value" value={formatPrice(totalValue)} icon={TrendingUp} iconColor="text-primary" delay={0.3} />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All ({myBookings.length})</TabsTrigger>
            <TabsTrigger value="progress">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground">Bookings from your leads will appear here</p>
            </Card>
          ) : (
            paginatedAll.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
              />
            ))
          )}

          <PaginationBar page={allPage} totalPages={allTotalPages} onPageChange={setAllPage} className="px-0" />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {filteredInProgress.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No In-Progress Bookings</h3>
              <p className="text-muted-foreground">Active bookings will appear here</p>
            </Card>
          ) : (
            paginatedInProgress.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
              />
            ))
          )}

          <PaginationBar page={progressPage} totalPages={progressTotalPages} onPageChange={setProgressPage} className="px-0" />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredCompleted.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold mb-2">No Completed Bookings</h3>
              <p className="text-muted-foreground">Completed bookings will appear here</p>
            </Card>
          ) : (
            paginatedCompleted.map((booking, index) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleViewDetails(booking)}
                delay={index * 0.05}
              />
            ))
          )}

          <PaginationBar page={completedPage} totalPages={completedTotalPages} onPageChange={setCompletedPage} className="px-0" />
        </TabsContent>
      </Tabs>

      <BookingDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        booking={selectedBooking}
        role="agent"
        onRefresh={loadBookings}
      />
    </PageWrapper>
  );
};
