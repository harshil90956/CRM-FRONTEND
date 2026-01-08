import { useOutletContext } from "react-router-dom";
import { TrendingUp, Users, IndianRupee, Target } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const monthlyData = [
  { month: "Jan", leads: 8, conversions: 2 },
  { month: "Feb", leads: 12, conversions: 3 },
  { month: "Mar", leads: 10, conversions: 2 },
  { month: "Apr", leads: 15, conversions: 4 },
  { month: "May", leads: 18, conversions: 5 },
  { month: "Jun", leads: 14, conversions: 3 },
];

const projectBreakdown = [
  { project: "Green Valley", leads: 18, conversions: 5 },
  { project: "Sky Heights", leads: 12, conversions: 3 },
  { project: "Palm Residency", leads: 8, conversions: 2 },
];

export const AgentPerformancePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  return (
    <PageWrapper title="My Performance" description="Track your sales performance and targets." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value="45" change={12} changeLabel="this month" icon={Users} delay={0} />
        <KPICard title="Conversions" value="12" change={25} changeLabel="vs last month" icon={TrendingUp} iconColor="text-success" delay={0.1} />
        <KPICard title="Conversion Rate" value="26.7%" change={3} changeLabel="vs avg" icon={Target} iconColor="text-warning" delay={0.2} />
        <KPICard title="Commission" value="₹4.2L" change={18} changeLabel="this month" icon={IndianRupee} iconColor="text-primary" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} name="Leads" />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--success))" strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Target</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Leads Target</span>
                <span className="text-sm font-medium">45 / 50</span>
              </div>
              <Progress value={90} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Conversions Target</span>
                <span className="text-sm font-medium">12 / 15</span>
              </div>
              <Progress value={80} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Revenue Target</span>
                <span className="text-sm font-medium">₹4.2L / ₹5L</span>
              </div>
              <Progress value={84} className="h-3" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Project-wise Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="project" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" fill="hsl(var(--success))" name="Conversions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageWrapper>
  );
};
