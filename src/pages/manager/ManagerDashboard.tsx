import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  Upload,
  Download,
  RefreshCw,
  Clock,
  Building2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { ProjectPerformanceChart } from "@/components/charts/ProjectPerformanceChart";
import { TopAgentsCard } from "@/components/cards/TopAgentsCard";
import { ActivityCard } from "@/components/cards/ActivityCard";
import { GoalsForm } from "@/components/forms/GoalsForm";
import { CsvImporter } from "@/components/csv/CsvImporter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTabs, DashboardTab } from "@/components/dashboard/DashboardTabs";
import { LiveMetricsCard } from "@/components/dashboard/LiveMetricsCard";
import { SummaryKPICard } from "@/components/dashboard/SummaryKPICard";
import { useToast } from "@/hooks/use-toast";
import { bookingsService, leadsService, managerDashboardService, paymentsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

const leadFields = ["name", "email", "phone", "status", "project", "budget"];
const leadFieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  status: "Status",
  project: "Project",
  budget: "Budget",
};

export const ManagerDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { toast } = useToast();
  const { goals } = useAppStore();
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('executive-summary');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  const downloadSampleCSV = (type: string) => {
    const headersByType: Record<string, string[]> = {
      leads: ['name', 'email', 'phone', 'status', 'project', 'budget'],
    };

    const headers = headersByType[type] || ['id'];
    const csv = `${headers.join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const createdDayKey = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (!Number.isFinite(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const createdMonthKey = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (!Number.isFinite(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      const parseBudget = (b: unknown): number => {
        if (typeof b === 'number' && Number.isFinite(b)) return b;
        if (typeof b !== 'string') return 0;
        const cleaned = b.replace(/[^0-9.]/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
      };

      const [overviewRes, bookingsRes, paymentsRes] = await Promise.all([
        managerDashboardService.overview(),
        bookingsService.list().catch(() => ({ success: true, data: [] } as any)),
        paymentsService.list().catch(() => ({ success: true, data: [] } as any)),
      ]);

      const overview = overviewRes.success ? overviewRes.data : null;

      const leads = (overview?.paged?.items || []) as any[];
      const leadTotal = Number(overview?.summary?.total ?? leads.length);

      const newToday = leads.filter((l) => createdDayKey(l.createdAt) === todayKey).length;
      const newYesterday = leads.filter((l) => createdDayKey(l.createdAt) === yesterdayKey).length;

      const activeLeadStatuses = new Set(['NEW', 'CONTACTED', 'FOLLOWUP', 'QUALIFIED', 'NEGOTIATION']);
      const activeLeads = leads.filter((l) => activeLeadStatuses.has(String(l.status))).length;
      const closedDeals = leads.filter((l) => String(l.status) === 'CONVERTED').length;
      const conversionRate = leadTotal > 0 ? Math.round((closedDeals / leadTotal) * 100) : 0;
      const leadsThisMonth = leads.filter((l) => createdMonthKey(l.createdAt) === monthKey).length;

      const convertedThisMonth = leads
        .filter((l) => String(l.status) === 'CONVERTED')
        .filter((l) => createdMonthKey(l.createdAt) === monthKey);
      const revenueThisMonth = convertedThisMonth.reduce((sum, l) => sum + parseBudget(l.budget), 0);

      const agents = (overview?.agents || []) as any[];
      const projects = (overview?.projects || []) as any[];
      const units = (overview?.units || []) as any[];
      const bookings = bookingsRes.success ? (bookingsRes.data || []) : [];
      const payments = paymentsRes.success ? (paymentsRes.data || []) : [];
      const activeProperties = projects.filter((p: any) => !p.isClosed && String(p.status).toUpperCase() !== 'CLOSED').length;

      setMetrics({
        totalLeads: leadTotal,
        newToday,
        newYesterday,
        activeLeads,
        conversionRate,
        closedDeals,
        communications: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        leadsThisMonth,
        revenueThisMonth,
        activeProperties,
        _raw: { leads, agents, projects, units, bookings, payments },
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
      setMetrics({
        totalLeads: 0,
        newToday: 0,
        newYesterday: 0,
        activeLeads: 0,
        conversionRate: 0,
        closedDeals: 0,
        communications: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        leadsThisMonth: 0,
        revenueThisMonth: 0,
        activeProperties: 0,
        _raw: { leads: [], agents: [], projects: [], units: [], bookings: [], payments: [] },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
    toast({
      title: "Metrics refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  const handleDownloadSampleCSV = () => {
    downloadSampleCSV('leads');
    toast({
      title: "Sample CSV Downloaded",
      description: "Check your downloads folder for the sample format file.",
    });
  };

  const handleImportLeads = async (data: any[]) => {
    try {
      const headers = leadFields;
      const rows = (data || []).map((r: any) => headers.map((h) => String(r?.[h] ?? '')));
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => {
        const value = String(cell ?? '');
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))].join('\n');

      const file = new File([csv], 'leads.csv', { type: 'text/csv' });
      const res = await leadsService.importManagerCsv(file);
      if (!res?.success) {
        toast({ title: 'Import failed', description: res?.message || 'Failed to import CSV', variant: 'destructive' as any });
        return;
      }

      const total = res.data?.total ?? data.length;
      const created = res.data?.created ?? 0;
      const skipped = res.data?.skipped ?? Math.max(0, total - created);
      toast({
        title: 'CSV Imported',
        description: `Imported ${created}/${total} (skipped ${skipped}).`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to import CSV';
      toast({ title: 'Import failed', description: msg, variant: 'destructive' as any });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <PageWrapper
      title="Manager Dashboard"
      description="Track your team's performance and manage operations."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleDownloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample CSV Format
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCsvOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Leads
          </Button>
          <Button size="sm" onClick={() => setIsTargetOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Set Targets
          </Button>
        </div>
      }
    >
      {/* Live Metrics Section */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Live Metrics</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(currentTime)}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <LiveMetricsCard
              title="Team Leads"
              value={metrics?.totalLeads || 0}
              subtitle="Assigned to your team"
              icon={Users}
              iconColor="text-primary"
              delay={0}
            />
            <LiveMetricsCard
              title="New Today"
              value={metrics?.newToday || 0}
              subtitle="Fresh prospects"
              icon={TrendingUp}
              iconColor="text-success"
              delay={0.1}
            />
            <LiveMetricsCard
              title="Active Leads"
              value={metrics?.activeLeads || 0}
              subtitle="Leads with recent activity"
              icon={Users}
              iconColor="text-info"
              delay={0.2}
            />
            <LiveMetricsCard
              title="Conversion Rate"
              value={`${metrics?.conversionRate || 0}%`}
              subtitle={`${metrics?.closedDeals || 0} closed deals`}
              icon={TrendingUp}
              iconColor="text-success"
              delay={0.3}
            />
            <LiveMetricsCard
              title="Target Progress"
              value={`${goals.conversionsTarget > 0 ? Math.round(((metrics?.closedDeals || 0) / goals.conversionsTarget) * 100) : 0}%`}
              subtitle={`${metrics?.closedDeals || 0}/${goals.conversionsTarget} conversions`}
              icon={Target}
              iconColor="text-warning"
              delay={0.4}
            />
            <LiveMetricsCard
              title="Pending Tasks"
              value={metrics?.pendingTasks || 0}
              subtitle="0 completed today"
              badge={`${metrics?.overdueTasks || 0} overdue`}
              badgeType="warning"
              icon={Target}
              iconColor="text-destructive"
              delay={0.5}
            />
          </div>
        )}
      </div>

      {/* Dashboard Tabs */}
      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <SummaryKPICard
              title="Leads This Month"
              value={metrics?.leadsThisMonth || 0}
              subtitle="0.0% vs last month"
              icon={Users}
              bgColor="bg-blue-50 dark:bg-blue-950/30"
              delay={0}
            />
            <SummaryKPICard
              title="Conversion Rate"
              value={`${metrics?.conversionRate || 0}%`}
              subtitle="Industry avg: 2-5%"
              icon={Target}
              bgColor="bg-amber-50 dark:bg-amber-950/30"
              delay={0.1}
            />
            <SummaryKPICard
              title="Revenue This Month"
              value={formatCurrency(metrics?.revenueThisMonth || 0)}
              subtitle="0% vs last month"
              icon={IndianRupee}
              bgColor="bg-rose-50 dark:bg-rose-950/30"
              delay={0.2}
            />
            <SummaryKPICard
              title="Active Properties"
              value={metrics?.activeProperties || 0}
              subtitle="Ready to sell"
              icon={Building2}
              bgColor="bg-emerald-50 dark:bg-emerald-950/30"
              delay={0.3}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LeadFunnelChart leads={metrics?._raw?.leads ?? []} />
        <ProjectPerformanceChart
          projects={metrics?._raw?.projects ?? []}
          units={metrics?._raw?.units ?? []}
          bookings={metrics?._raw?.bookings ?? []}
          payments={metrics?._raw?.payments ?? []}
        />
      </div>

      {/* Activity & Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopAgentsCard users={metrics?._raw?.agents ?? []} leads={metrics?._raw?.leads ?? []} />
        <ActivityCard
          users={metrics?._raw?.agents ?? []}
          leads={metrics?._raw?.leads ?? []}
          bookings={metrics?._raw?.bookings ?? []}
          payments={metrics?._raw?.payments ?? []}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'lead-analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Lead Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Lead Sources</h4>
              <div className="space-y-2">
                {(() => {
                  const leads = (metrics?._raw?.leads || []) as any[];
                  const total = leads.length || 0;
                  const counts = new Map<string, number>();
                  for (const l of leads) {
                    const key = String(l.source || 'Unknown');
                    counts.set(key, (counts.get(key) || 0) + 1);
                  }
                  const rows = Array.from(counts.entries())
                    .map(([k, c]) => ({ k, c, pct: total > 0 ? Math.round((c / total) * 100) : 0 }))
                    .sort((a, b) => b.c - a.c)
                    .slice(0, 4);
                  if (rows.length === 0) {
                    return <div className="text-sm text-muted-foreground">No data yet.</div>;
                  }
                  return rows.map((r) => (
                    <div key={r.k} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{r.k}</span>
                      <span className="text-sm font-medium">{r.pct}%</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Conversion Funnel</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Leads</span>
                  <span className="text-sm font-medium">{Number(metrics?.totalLeads || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Qualified</span>
                  <span className="text-sm font-medium">{Number((metrics?._raw?.leads || []).filter((l: any) => String(l.status) === 'QUALIFIED').length || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Negotiation</span>
                  <span className="text-sm font-medium">{Number((metrics?._raw?.leads || []).filter((l: any) => String(l.status) === 'NEGOTIATION').length || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Closed Deals</span>
                  <span className="text-sm font-medium">{Number(metrics?.closedDeals || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Lead Quality</h4>
              <div className="space-y-2">
                {(() => {
                  const leads = (metrics?._raw?.leads || []) as any[];
                  const hot = leads.filter((l) => String(l.priority).toLowerCase() === 'high').length;
                  const warm = leads.filter((l) => String(l.priority).toLowerCase() === 'medium').length;
                  const cold = leads.length - hot - warm;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Hot Leads</span>
                        <span className="text-sm font-medium text-success">{hot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Warm Leads</span>
                        <span className="text-sm font-medium text-warning">{warm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cold Leads</span>
                        <span className="text-sm font-medium text-muted">{Math.max(0, cold)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales-revenue' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Sales & Revenue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Monthly Revenue</h4>
              <p className="text-2xl font-bold text-primary">{formatCurrency(Number(metrics?.revenueThisMonth || 0))}</p>
              <p className="text-sm text-muted-foreground">Based on converted leads budget</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Average Deal Size</h4>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency((metrics?.closedDeals || 0) > 0 ? Number(metrics?.revenueThisMonth || 0) / Number(metrics?.closedDeals || 1) : 0)}
              </p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Sales Cycle</h4>
              <p className="text-2xl font-bold text-primary">—</p>
              <p className="text-sm text-muted-foreground">No data yet</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Win Rate</h4>
              <p className="text-2xl font-bold text-primary">{metrics?.conversionRate || 0}%</p>
              <p className="text-sm text-muted-foreground">Converted / total</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team-performance' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Team Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Top Performers</h4>
              <div className="space-y-2">
                {(() => {
                  const agents = (metrics?._raw?.agents || []) as any[];
                  const leads = (metrics?._raw?.leads || []) as any[];
                  const convById = new Map<string, number>();
                  for (const l of leads) {
                    const assignedId = String(l?.assignedTo?.id || l?.assignedToId || '');
                    if (!assignedId) continue;
                    if (String(l.status) === 'CONVERTED') {
                      convById.set(assignedId, (convById.get(assignedId) || 0) + 1);
                    }
                  }

                  const rows = agents
                    .map((a) => ({ name: String(a.name || 'Agent'), deals: convById.get(String(a.id)) || 0 }))
                    .sort((a, b) => b.deals - a.deals)
                    .slice(0, 3);

                  if (rows.length === 0) {
                    return <div className="text-sm text-muted-foreground">No data yet.</div>;
                  }

                  return rows.map((r) => (
                    <div key={r.name} className="flex justify-between">
                      <span className="text-sm">{r.name}</span>
                      <span className="text-sm font-medium text-success">{r.deals} deals</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Team Metrics</h4>
              <div className="space-y-2">
                {(() => {
                  const agents = (metrics?._raw?.agents || []) as any[];
                  const teamSize = agents.length;
                  const totalLeads = Number(metrics?.totalLeads || 0);
                  const avg = teamSize > 0 ? (totalLeads / teamSize).toFixed(1) : '0';
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Team Size</span>
                        <span className="text-sm font-medium">{teamSize} agents</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Leads/Agent</span>
                        <span className="text-sm font-medium">{avg}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Team Target</span>
                        <span className="text-sm font-medium">{Number(goals?.conversionsTarget || 0)} deals</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Performance Rating</h4>
              <div className="space-y-2">
                {(() => {
                  const agents = (metrics?._raw?.agents || []) as any[];
                  const leads = (metrics?._raw?.leads || []) as any[];
                  const convById = new Map<string, number>();
                  for (const l of leads) {
                    const assignedId = String(l?.assignedTo?.id || l?.assignedToId || '');
                    if (!assignedId) continue;
                    if (String(l.status) === 'CONVERTED') {
                      convById.set(assignedId, (convById.get(assignedId) || 0) + 1);
                    }
                  }

                  let excellent = 0;
                  let good = 0;
                  let needs = 0;

                  for (const a of agents) {
                    const c = convById.get(String(a.id)) || 0;
                    if (c >= 5) excellent += 1;
                    else if (c >= 2) good += 1;
                    else needs += 1;
                  }

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Excellent</span>
                        <span className="text-sm font-medium text-success">{excellent} agents</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Good</span>
                        <span className="text-sm font-medium text-warning">{good} agents</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Needs Improvement</span>
                        <span className="text-sm font-medium text-destructive">{needs} agents</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Total Properties</h4>
              <p className="text-2xl font-bold text-primary">{Number((metrics?._raw?.units || []).length || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Across {Number((metrics?._raw?.projects || []).length || 0).toLocaleString()} projects</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Available</h4>
              {(() => {
                const units = (metrics?._raw?.units || []) as any[];
                const total = units.length || 0;
                const available = units.filter((u) => String(u.status) === 'AVAILABLE').length;
                const pct = total > 0 ? Math.round((available / total) * 100) : 0;
                return (
                  <>
                    <p className="text-2xl font-bold text-success">{available}</p>
                    <p className="text-sm text-success">{pct}% availability</p>
                  </>
                );
              })()}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Booked</h4>
              {(() => {
                const units = (metrics?._raw?.units || []) as any[];
                const total = units.length || 0;
                const booked = units.filter((u) => String(u.status) === 'BOOKED').length;
                const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
                return (
                  <>
                    <p className="text-2xl font-bold text-warning">{booked}</p>
                    <p className="text-sm text-warning">{pct}% booked</p>
                  </>
                );
              })()}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Sold</h4>
              {(() => {
                const units = (metrics?._raw?.units || []) as any[];
                const total = units.length || 0;
                const sold = units.filter((u) => String(u.status) === 'SOLD').length;
                const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
                return (
                  <>
                    <p className="text-2xl font-bold text-primary">{sold}</p>
                    <p className="text-sm text-muted-foreground">{pct}% sold</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Communications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Email Campaigns</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No data yet.</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Phone Calls</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No data yet.</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Meetings</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No data yet.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks-activity' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Tasks & Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Pending Tasks</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm font-medium">{Number(metrics?.pendingTasks || 0)}</span>
                </div>
                <div className="text-sm text-muted-foreground">No task module connected yet.</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Today's Activity</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No activity tracking connected yet.</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Upcoming</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">No upcoming schedule connected yet.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Targets Modal */}
      <GoalsForm open={isTargetOpen} onOpenChange={setIsTargetOpen} />

      {/* CSV Importer */}
      <CsvImporter
        open={isCsvOpen}
        onOpenChange={setIsCsvOpen}
        onImport={handleImportLeads}
        requiredFields={leadFields}
        fieldLabels={leadFieldLabels}
      />
    </PageWrapper>
  );
};
