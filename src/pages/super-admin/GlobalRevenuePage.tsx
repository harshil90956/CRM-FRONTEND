import { useOutletContext } from "react-router-dom";
import { IndianRupee, TrendingUp, Building2, Users } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAppStore } from "@/stores/appStore";

const tenantRevenue = [
  { name: "Prestige", revenue: 125 },
  { name: "Godrej", revenue: 89 },
  { name: "DLF", revenue: 210 },
  { name: "Sobha", revenue: 45 },
];

const subscriptionData = [
  { name: "Enterprise", value: 8, color: "hsl(var(--primary))" },
  { name: "Business", value: 15, color: "hsl(var(--info))" },
  { name: "Starter", value: 7, color: "hsl(var(--warning))" },
];

export const GlobalRevenuePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { tenants } = useAppStore();

  return (
    <PageWrapper title="Global Revenue" description="Platform-wide revenue analytics." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Revenue" value="₹469 Cr" change={22} changeLabel="YoY" icon={IndianRupee} delay={0} />
        <KPICard title="MRR" value="₹3.2 Cr" change={15} changeLabel="vs last month" icon={TrendingUp} iconColor="text-success" delay={0.1} />
        <KPICard title="Active Tenants" value={tenants.filter(t => t.status === "Active").length} icon={Building2} iconColor="text-info" delay={0.2} />
        <KPICard title="Paying Users" value="162" change={8} changeLabel="this month" icon={Users} iconColor="text-warning" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subscriptionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {subscriptionData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
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
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageWrapper>
  );
};
