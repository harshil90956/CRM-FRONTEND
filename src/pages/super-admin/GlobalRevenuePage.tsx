import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { IndianRupee, TrendingUp, Building2, Users } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { superAdminUsersService } from "@/api";
import { toast } from "sonner";

export const GlobalRevenuePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const [isLoading, setIsLoading] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);
  const [thisMonthReceived, setThisMonthReceived] = useState(0);
  const [lastMonthReceived, setLastMonthReceived] = useState(0);
  const [activeTenants, setActiveTenants] = useState(0);
  const [suspendedTenants, setSuspendedTenants] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [tenantRevenue, setTenantRevenue] = useState<{ name: string; revenue: number }[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<{ month: string; revenueCr: number; targetCr: number }[]>([]);

  const formatMoney = (amount: number): string => {
    if (!Number.isFinite(amount) || amount <= 0) return "₹0";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const res = await superAdminUsersService.revenueAnalytics();
        const data = res.data;

        setTotalReceived(data?.totalReceived || 0);
        setThisMonthReceived(data?.thisMonthReceived || 0);
        setLastMonthReceived(data?.lastMonthReceived || 0);
        setActiveTenants(data?.activeTenants || 0);
        setSuspendedTenants(data?.suspendedTenants || 0);
        setPayingUsers(data?.payingUsers || 0);
        setRevenueSeries(data?.revenueSeries || []);
        setTenantRevenue((data?.tenantRevenueTop || []).map((t) => ({ name: t.name, revenue: t.revenueCr })));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load revenue analytics');
        setActiveTenants(0);
        setSuspendedTenants(0);
        setTotalReceived(0);
        setThisMonthReceived(0);
        setLastMonthReceived(0);
        setPayingUsers(0);
        setTenantRevenue([]);
        setRevenueSeries([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const mrrChange = useMemo(() => {
    if (!Number.isFinite(lastMonthReceived) || lastMonthReceived <= 0) return 0;
    return Math.round(((thisMonthReceived - lastMonthReceived) / lastMonthReceived) * 100);
  }, [thisMonthReceived, lastMonthReceived]);

  const tenantStatusData = useMemo(() => {
    return [
      { name: "Active", value: activeTenants, color: "hsl(var(--primary))" },
      { name: "Suspended", value: suspendedTenants, color: "hsl(var(--destructive))" },
    ].filter((x) => x.value > 0);
  }, [activeTenants, suspendedTenants]);

  return (
    <PageWrapper title="Global Revenue" description="Platform-wide revenue analytics." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Revenue" value={formatMoney(totalReceived)} icon={IndianRupee} delay={0} />
        <KPICard title="MRR" value={formatMoney(thisMonthReceived)} change={mrrChange} changeLabel="vs last month" icon={TrendingUp} iconColor="text-success" delay={0.1} />
        <KPICard title="Active Tenants" value={activeTenants} icon={Building2} iconColor="text-info" delay={0.2} />
        <KPICard title="Paying Users" value={payingUsers} icon={Users} iconColor="text-warning" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><RevenueChart series={revenueSeries} /></div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tenant Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tenantStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {tenantStatusData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Tenant</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tenantRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `₹${v}Cr`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {isLoading && (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      )}
    </PageWrapper>
  );
};
