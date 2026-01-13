import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ClipboardList, CheckCircle, Clock, IndianRupee } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { superAdminBookingsService } from "@/api";
import { toast } from "sonner";

export const GlobalBookingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState({
    totalBookings: 0,
    booked: 0,
    holds: 0,
    cancelledOrRefunded: 0,
    totalBookingValue: 0,
    totalTokenValue: 0,
  });
  const [byProject, setByProject] = useState<
    Array<{
      projectId: string;
      projectName: string;
      tenantId: string;
      totalBookings: number;
      booked: number;
      holds: number;
      cancelledOrRefunded: number;
      totalBookingValue: number;
      totalTokenValue: number;
    }>
  >([]);

  const formatMoney = (amount: number): string => {
    if (!Number.isFinite(amount) || amount <= 0) return "₹0";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const [ovRes, projRes] = await Promise.all([
          superAdminBookingsService.overview(),
          superAdminBookingsService.projects(),
        ]);

        setOverview({
          totalBookings: ovRes.data?.totalBookings || 0,
          booked: ovRes.data?.booked || 0,
          holds: ovRes.data?.holds || 0,
          cancelledOrRefunded: ovRes.data?.cancelledOrRefunded || 0,
          totalBookingValue: ovRes.data?.totalBookingValue || 0,
          totalTokenValue: ovRes.data?.totalTokenValue || 0,
        });

        const items = projRes.data?.items || [];
        items.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
        setByProject(items);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load bookings analytics');
        setOverview({
          totalBookings: 0,
          booked: 0,
          holds: 0,
          cancelledOrRefunded: 0,
          totalBookingValue: 0,
          totalTokenValue: 0,
        });
        setByProject([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    return (byProject || []).slice(0, 10).map((p) => ({
      name: p.projectName || p.projectId,
      bookings: p.totalBookings,
    }));
  }, [byProject]);

  return (
    <PageWrapper title="Global Bookings" description="Platform-wide bookings analytics by project." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Bookings" value={overview.totalBookings} icon={ClipboardList} delay={0} />
        <KPICard title="Booked" value={overview.booked} icon={CheckCircle} iconColor="text-success" delay={0.1} />
        <KPICard title="Holds" value={overview.holds} icon={Clock} iconColor="text-warning" delay={0.2} />
        <KPICard title="Booking Value" value={formatMoney(overview.totalBookingValue)} icon={IndianRupee} iconColor="text-primary" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bookings by Project (Top 10)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Totals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Token Value</span><span className="font-medium">{formatMoney(overview.totalTokenValue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cancelled/Refunded</span><span className="font-medium">{overview.cancelledOrRefunded}</span></div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Projects</h3>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-table-header hover:bg-table-header">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Tenant</TableHead>
                <TableHead className="font-semibold">Total Bookings</TableHead>
                <TableHead className="font-semibold">Booked</TableHead>
                <TableHead className="font-semibold">Holds</TableHead>
                <TableHead className="font-semibold">Cancelled</TableHead>
                <TableHead className="font-semibold">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProject.map((p) => (
                <TableRow key={p.projectId} className="hover:bg-table-row-hover transition-colors">
                  <TableCell className="font-medium">{p.projectName || p.projectId}</TableCell>
                  <TableCell className="text-muted-foreground">{p.tenantId}</TableCell>
                  <TableCell className="text-muted-foreground">{p.totalBookings}</TableCell>
                  <TableCell className="text-muted-foreground">{p.booked}</TableCell>
                  <TableCell className="text-muted-foreground">{p.holds}</TableCell>
                  <TableCell className="text-muted-foreground">{p.cancelledOrRefunded}</TableCell>
                  <TableCell className="font-medium">{formatMoney(p.totalBookingValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {isLoading && (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      )}
    </PageWrapper>
  );
};
