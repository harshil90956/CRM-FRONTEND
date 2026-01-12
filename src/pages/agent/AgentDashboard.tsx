import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { LeadsTable } from "@/components/tables/LeadsTable";
import { TodaysGoalsSheet } from "@/components/forms/TodaysGoalsSheet";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { leadsService } from "@/api";

type PerfRow = { week: string; leads: number; conversions: number };

const upcomingTasks = [
  { id: 1, type: "call", title: "Follow up with Rajesh Kumar", time: "10:00 AM", icon: Phone },
  { id: 2, type: "meeting", title: "Site visit - Green Valley", time: "2:00 PM", icon: Calendar },
  { id: 3, type: "document", title: "Send brochure to Anita Sharma", time: "4:00 PM", icon: FileText },
];

export const AgentDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [isGoalsSheetOpen, setIsGoalsSheetOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await leadsService.listAgentLeads();
        if (!res.success) return;
        setLeads(res.data || []);
      } catch {
        setLeads([]);
      }
    })();
  }, []);

  const parseBudget = (b: unknown): number => {
    if (typeof b === 'number' && Number.isFinite(b)) return b;
    if (typeof b !== 'string') return 0;
    const cleaned = b.replace(/[^0-9.]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const conversions = leads.filter((l) => String(l.status) === 'CONVERTED').length;
    const conversionRate = total > 0 ? Math.round((conversions / total) * 1000) / 10 : 0;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const createdMonthKey = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const revenueThisMonth = leads
      .filter((l) => String(l.status) === 'CONVERTED')
      .filter((l) => createdMonthKey(l.createdAt) === monthKey)
      .reduce((sum, l) => sum + parseBudget(l.budget), 0);

    const commissionThisMonth = Math.round(revenueThisMonth * 0.01);

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startOfWeekIndex = (d: Date) => Math.floor((d.getTime() - (now.getTime() - 3 * weekMs)) / weekMs);
    const buckets: PerfRow[] = [
      { week: 'W1', leads: 0, conversions: 0 },
      { week: 'W2', leads: 0, conversions: 0 },
      { week: 'W3', leads: 0, conversions: 0 },
      { week: 'W4', leads: 0, conversions: 0 },
    ];

    for (const l of leads) {
      const d = new Date(l.createdAt);
      if (!Number.isFinite(d.getTime())) continue;
      const idx = startOfWeekIndex(d);
      if (idx < 0 || idx > 3) continue;
      buckets[idx].leads += 1;
      if (String(l.status) === 'CONVERTED') buckets[idx].conversions += 1;
    }

    return {
      total,
      conversions,
      conversionRate,
      commissionThisMonth,
      performanceData: buckets,
    };
  }, [leads]);

  return (
    <PageWrapper
      title="My Dashboard"
      description="Track your leads and performance metrics."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm" onClick={() => setIsGoalsSheetOpen(true)}>
          <Target className="w-4 h-4 mr-2" />
          Today's Goals
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="My Leads"
          value={String(metrics.total)}
          changeLabel="assigned"
          icon={Users}
          delay={0}
        />
        <KPICard
          title="Conversions"
          value={String(metrics.conversions)}
          changeLabel="total"
          icon={TrendingUp}
          iconColor="text-success"
          delay={0.1}
        />
        <KPICard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          changeLabel="from assigned"
          icon={Target}
          iconColor="text-warning"
          delay={0.2}
        />
        <KPICard
          title="Commission"
          value={`₹${Number(metrics.commissionThisMonth || 0).toLocaleString()}`}
          changeLabel="est. this month"
          icon={IndianRupee}
          iconColor="text-primary"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 card-elevated p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">My Performance</h3>
            <p className="text-sm text-muted-foreground">Weekly leads & conversions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Leads"
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
            <p className="text-sm text-muted-foreground">Your schedule for today</p>
          </div>
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <task.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* My Leads */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">My Assigned Leads</h3>
            <p className="text-sm text-muted-foreground">Leads assigned to you</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <LeadsTable limit={5} />
      </div>

      {/* Today's Goals Sheet */}
      <TodaysGoalsSheet open={isGoalsSheetOpen} onOpenChange={setIsGoalsSheetOpen} />
    </PageWrapper>
  );
};
