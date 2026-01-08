import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Download, IndianRupee, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Booking, Payment } from "@/data/mockData";
import { mockApi } from "@/lib/mockApi";
import { formatPrice } from "@/lib/unitHelpers";
import { useAppStore } from "@/stores/appStore";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const CustomerPaymentsPage = () => {
  const { currentUser } = useAppStore();
  const customerId = currentUser?.id || "u_cust_2";

  const [accessEnabled, setAccessEnabled] = useState(false);
  const [credits, setCredits] = useState(0);
  const [latestAdminPaymentStatus, setLatestAdminPaymentStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "NONE">("NONE");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");

  const loadAccess = () => {
    const bookings = mockApi.getAll<any>("bookings");
    const latest = bookings
      .filter((b: any) => b.customerId === customerId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const status = (latest?.status || "NONE") as any;
    setLatestAdminPaymentStatus(status);
    setAccessEnabled(status === "APPROVED");
    setCredits(status === "APPROVED" ? Number(latest?.tokenAmount || 0) : 0);
  };

  const loadData = async () => {
    const [paymentsData, bookingsData] = await Promise.all([
      mockApi.get<Payment[]>("/payments"),
      mockApi.get<Booking[]>("/bookings"),
    ]);

    const myBookings = bookingsData.filter(
      (b) => b.customerId === customerId || b.customerId.includes("cust")
    );

    const myBookingIds = new Set(myBookings.map((b) => b.id));
    const myPayments = paymentsData
      .filter((p) => p.customerId === customerId || (p.bookingId && myBookingIds.has(p.bookingId)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setBookings(myBookings);
    setPayments(myPayments);
    loadAccess();
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onStorage = () => loadAccess();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, [customerId]);

  const tokenPendingBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        !b.tokenPaymentId &&
        ["PENDING"].includes(b.status)
    );
  }, [bookings]);

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter((p) => {
      return (
        p.unitNo.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const { page, setPage, totalPages, pageItems: paginatedPayments } = useClientPagination(filteredPayments, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  const downloadPaymentReceipt = (payment: Payment) => {
    mockApi.downloadReceipt("payment", payment);
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
            <Link to="/customer/bookings" className="text-sm text-muted-foreground hover:text-foreground">My Bookings</Link>
            <Link to="/customer/payments" className="text-sm font-medium text-primary">Payments</Link>
            <Link to="/customer/profile" className="text-sm text-muted-foreground hover:text-foreground">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Payments</h1>
          <p className="text-muted-foreground">Track token payments and receipts</p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Access Status</h2>
            </div>
            <Badge className="w-fit" variant={accessEnabled ? "default" : "secondary"}>{accessEnabled ? "ACTIVE" : "LOCKED"}</Badge>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <div>Latest Payment Status: <span className="font-medium text-foreground">{latestAdminPaymentStatus}</span></div>
            <div>Credits: <span className="font-medium text-foreground">{credits}</span></div>
          </div>
        </Card>

        {tokenPendingBookings.length > 0 && (
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Token Payment Pending</h2>
              </div>
              <Badge className="w-fit" variant="secondary">{tokenPendingBookings.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokenPendingBookings.map((b) => (
                <div key={b.id} className="p-4 border rounded-lg flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{b.unitNo}</p>
                    <p className="text-sm text-muted-foreground">{b.projectName}</p>
                    <p className="text-sm mt-2">Token: <span className="font-semibold text-primary">{formatPrice(b.tokenAmount)}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Status: {b.status.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-right">
                    Awaiting admin approval
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No payments found</div>
          ) : (
            <div>
              <div className="space-y-3">
                {paginatedPayments.map((p) => (
                  <div key={p.id} className="p-4 border rounded-lg flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{p.type}</Badge>
                        <Badge variant={p.status === "Received" ? "default" : p.status === "Refunded" ? "secondary" : "outline"} className="text-xs">
                          {p.status}
                        </Badge>
                      </div>
                      <p className="font-semibold mt-2">{p.unitNo}</p>
                      <p className="text-sm text-muted-foreground">{new Date(p.date).toLocaleString()} • {p.method}</p>
                      {p.receiptNo && (
                        <p className="text-xs text-muted-foreground mt-1">Receipt: {p.receiptNo}</p>
                      )}
                      {p.notes && (
                        <p className="text-xs text-muted-foreground mt-1">Notes: {p.notes}</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-primary">{formatPrice(p.amount)}</p>
                      <Button size="sm" variant="outline" className="mt-2 w-full sm:w-auto" onClick={() => downloadPaymentReceipt(p)}>
                        <Download className="w-4 h-4 mr-2" /> Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0 border-t-0" />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
