import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { TrendingUp, Users, IndianRupee, Target } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

import { leadsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

export const AgentPerformancePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { goals } = useAppStore();
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

  const { total, conversions, conversionRate, monthlyData, projectBreakdown, revenueThisMonth } = useMemo(() => {
    const now = new Date();
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

    const buckets = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now);
      d.setMonth(now.getMonth() - (5 - i));
      return { key: monthKey(d), label: monthLabel(d), leads: 0, conversions: 0 };
    });

    for (const l of leads) {
      const d = new Date(l.createdAt);
      if (!Number.isFinite(d.getTime())) continue;
      const key = monthKey(d);
      const b = buckets.find((x) => x.key === key);
      if (!b) continue;
      b.leads += 1;
      if (String(l.status) === 'CONVERTED') b.conversions += 1;
    }

    const totalLeads = leads.length;
    const conv = leads.filter((l) => String(l.status) === 'CONVERTED').length;
    const rate = totalLeads > 0 ? Math.round((conv / totalLeads) * 1000) / 10 : 0;

    const projectMap = new Map<string, { project: string; leads: number; conversions: number }>();
    for (const l of leads) {
      const key = String(l.project?.name || l.projectId || 'Unassigned');
      const row = projectMap.get(key) || { project: key, leads: 0, conversions: 0 };
      row.leads += 1;
      if (String(l.status) === 'CONVERTED') row.conversions += 1;
      projectMap.set(key, row);
    }

    const projRows = Array.from(projectMap.values())
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8);

    const currentMonthKey = monthKey(now);
    const revenue = leads
      .filter((l) => String(l.status) === 'CONVERTED')
      .filter((l) => {
        const d = new Date(l.createdAt);
        if (!Number.isFinite(d.getTime())) return false;
        return monthKey(d) === currentMonthKey;
      })
      .reduce((sum, l) => sum + parseBudget(l.budget), 0);

    return {
      total: totalLeads,
      conversions: conv,
      conversionRate: rate,
      monthlyData: buckets.map((b) => ({ month: b.label, leads: b.leads, conversions: b.conversions })),
      projectBreakdown: projRows,
      revenueThisMonth: revenue,
    };
  }, [leads]);

  const leadsTarget = Number(goals?.leadsTarget || 0);
  const conversionsTarget = Number(goals?.conversionsTarget || 0);
  const revenueTarget = Number(goals?.monthlyTarget || 0);
  const leadsProgress = leadsTarget > 0 ? Math.min(100, Math.round((total / leadsTarget) * 100)) : 0;
  const conversionsProgress = conversionsTarget > 0 ? Math.min(100, Math.round((conversions / conversionsTarget) * 100)) : 0;
  const revenueProgress = revenueTarget > 0 ? Math.min(100, Math.round((revenueThisMonth / revenueTarget) * 100)) : 0;

  return (
    <PageWrapper title="My Performance" description="Track your sales performance and targets." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value={String(total)} changeLabel="assigned" icon={Users} delay={0} />
        <KPICard title="Conversions" value={String(conversions)} changeLabel="total" icon={TrendingUp} iconColor="text-success" delay={0.1} />
        <KPICard title="Conversion Rate" value={`${conversionRate}%`} changeLabel="from assigned" icon={Target} iconColor="text-warning" delay={0.2} />
        <KPICard title="Commission" value={`₹${Math.round(revenueThisMonth * 0.01).toLocaleString()}`} changeLabel="est. this month" icon={IndianRupee} iconColor="text-primary" delay={0.3} />
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
                <span className="text-sm font-medium">{total} / {leadsTarget || 0}</span>
              </div>
              <Progress value={leadsProgress} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Conversions Target</span>
                <span className="text-sm font-medium">{conversions} / {conversionsTarget || 0}</span>
              </div>
              <Progress value={conversionsProgress} className="h-3" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Revenue Target</span>
                <span className="text-sm font-medium">₹{Math.round(revenueThisMonth).toLocaleString()} / ₹{Math.round(revenueTarget || 0).toLocaleString()}</span>
              </div>
              <Progress value={revenueProgress} className="h-3" />
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
