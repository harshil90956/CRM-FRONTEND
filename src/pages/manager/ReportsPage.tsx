import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BarChart3, Download, Calendar, Building, Users, TrendingUp, DollarSign } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { ProjectPerformanceChart } from "@/components/charts/ProjectPerformanceChart";
import { Progress } from "@/components/ui/progress";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { bookingsService, managerDashboardService, paymentsService, projectsService, unitsService } from "@/api";

export const ManagerReportsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("team");
  const [dateRange, setDateRange] = useState("30");

  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await managerDashboardService.overview();
      setOverview(res?.success ? (res as any).data : null);
    } catch (e: any) {
      setOverview(null);
      toast({
        title: "Failed to load reports",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const parseRangeDays = (value: string): number => {
    const n = Number.parseInt(String(value || ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 30;
  };

  const budgetToNumber = (b: unknown): number => {
    if (typeof b === "number" && Number.isFinite(b)) return b;
    if (typeof b !== "string") return 0;
    const lower = b.toLowerCase();
    const numeric = Number(lower.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numeric)) return 0;
    if (lower.includes("cr")) return numeric * 10000000;
    if (lower.includes("lac") || lower.includes("lakh") || /\bl\b/.test(lower) || lower.endsWith("l")) return numeric * 100000;
    return numeric;
  };

  const createdWithinDays = (iso: unknown, days: number): boolean => {
    if (typeof iso !== "string") return false;
    const d = new Date(iso);
    const t = d.getTime();
    if (!Number.isFinite(t)) return false;
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return t >= cutoff && t <= now;
  };

  // Date filtering logic
  const filteredLeads = useMemo(() => {
    const days = parseRangeDays(dateRange);
    const leads = ((overview as any)?.paged?.items ?? []) as any[];
    return leads.filter((l) => createdWithinDays(l.createdAt, days));
  }, [dateRange, overview]);

  const derivedAgents = useMemo(() => {
    const apiAgents = (((overview as any)?.agents ?? []) as any[])
      .map((a) => ({ id: String(a.id), name: String(a.name || "Agent") }))
      .filter((a) => a.id);

    if (apiAgents.length > 0) return apiAgents;

    const map = new Map<string, string>();
    for (const l of filteredLeads) {
      const a = l?.assignedTo;
      const id = typeof a?.id === "string" ? a.id : "";
      const name = typeof a?.name === "string" ? a.name : "Agent";
      if (id) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [filteredLeads, overview]);

  const agentRows = useMemo(() => {
    const byAgent = new Map<
      string,
      { id: string; name: string; totalLeads: number; conversions: number; revenue: number }
    >();

    for (const a of derivedAgents) {
      byAgent.set(a.id, { id: a.id, name: a.name, totalLeads: 0, conversions: 0, revenue: 0 });
    }

    for (const l of filteredLeads) {
      const assignedId = String(l?.assignedTo?.id || l?.assignedToId || "");
      if (!assignedId) continue;
      const name = String(l?.assignedTo?.name || byAgent.get(assignedId)?.name || "Agent");
      if (!byAgent.has(assignedId)) {
        byAgent.set(assignedId, { id: assignedId, name, totalLeads: 0, conversions: 0, revenue: 0 });
      }

      const row = byAgent.get(assignedId)!;
      row.totalLeads += 1;

      if (String(l?.status) === "CONVERTED") {
        row.conversions += 1;
        row.revenue += budgetToNumber(l?.budget);
      }
    }

    return Array.from(byAgent.values());
  }, [derivedAgents, filteredLeads]);

  const sortedAgents = useMemo(() => {
    return [...agentRows].sort((a, b) => b.conversions - a.conversions);
  }, [agentRows]);

  const { page, setPage, totalPages, pageItems: paginatedAgents } = useClientPagination(sortedAgents, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [reportType, dateRange, setPage]);

  // Export functionality
  const handleExport = () => {
    try {
      let csvData = [];
      let filename = '';
      
      if (reportType === 'team') {
        csvData = sortedAgents.map((agent, index) => ({
          'Rank': index + 1,
          'Agent Name': agent.name,
          'Total Leads': agent.totalLeads,
          'Conversions': agent.conversions,
          'Conversion Rate': `${((agent.conversions / agent.totalLeads) * 100).toFixed(1)}%`,
          'Revenue': `₹${Math.round(agent.revenue || 0).toLocaleString()}`,
        }));
        filename = `team-report-${dateRange}-days.csv`;
      } else if (reportType === 'leads') {
        csvData = [
          { 'Metric': 'Total Leads', 'Value': agentRows.reduce((s, a) => s + a.totalLeads, 0) },
          { 'Metric': 'Conversions', 'Value': agentRows.reduce((s, a) => s + a.conversions, 0) },
          { 'Metric': 'Conversion Rate', 'Value': agentRows.reduce((s, a) => s + a.totalLeads, 0) > 0 ? `${((agentRows.reduce((s, a) => s + a.conversions, 0) / agentRows.reduce((s, a) => s + a.totalLeads, 0)) * 100).toFixed(1)}%` : '0%' },
          { 'Metric': 'Report Period', 'Value': `Last ${dateRange} Days` },
        ];
        filename = `leads-report-${dateRange}-days.csv`;
      } else if (reportType === 'projects') {
        throw new Error('Use async export');
      }

      // Convert to CSV
      if (csvData.length === 0) {
        throw new Error('No data to export');
      }
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Report exported as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAsync = async () => {
    if (reportType !== 'projects') {
      handleExport();
      return;
    }

    try {
      const [projectsRes, unitsRes, bookingsRes, paymentsRes] = await Promise.all([
        projectsService.list(),
        unitsService.list(),
        bookingsService.list(),
        paymentsService.list(),
      ]);

      const projects = projectsRes.success ? (projectsRes.data || []) : [];
      const units = unitsRes.success ? (unitsRes.data || []) : [];
      const bookings = bookingsRes.success ? (bookingsRes.data || []) : [];
      const payments = paymentsRes.success ? (paymentsRes.data || []) : [];

      const projectIdByUnitId = new Map<string, string>();
      for (const u of units as any[]) {
        if ((u as any).id && (u as any).projectId) projectIdByUnitId.set((u as any).id, (u as any).projectId);
      }

      const bookingsByProjectId = new Map<string, number>();
      for (const b of bookings as any[]) {
        const pid = (b as any).projectId || projectIdByUnitId.get((b as any).unitId) || '';
        if (!pid) continue;
        bookingsByProjectId.set(pid, (bookingsByProjectId.get(pid) || 0) + 1);
      }

      const revenueByProjectId = new Map<string, number>();
      for (const pay of payments as any[]) {
        if (String((pay as any).status) !== 'Received') continue;
        const pid = projectIdByUnitId.get((pay as any).unitId) || '';
        if (!pid) continue;
        revenueByProjectId.set(pid, (revenueByProjectId.get(pid) || 0) + ((pay as any).amount || 0));
      }

      const rows = (projects as any[]).map((p) => {
        const pid = String((p as any).id);
        const bookingsCount = bookingsByProjectId.get(pid) || 0;
        const revenueAmount = revenueByProjectId.get(pid) || 0;
        const revenueCr = (revenueAmount / 10000000).toFixed(2);
        return {
          Project: String((p as any).name || 'Project'),
          Bookings: bookingsCount,
          'Revenue (Cr)': revenueCr,
        };
      });

      if (rows.length === 0) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => headers.map((header) => `"${(row as any)[header]}"`).join(',')),
      ].join('\n');

      const filename = `projects-report-${dateRange}-days.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: `Report exported as ${filename}`,
      });
    } catch (e: any) {
      toast({
        title: 'Export Failed',
        description: e?.message || 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageWrapper title="Reports" description="Team performance and sales reports." sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={loadOverview} disabled={isLoading}>
            Refresh
          </Button>
          <Button className="w-full sm:w-auto" size="sm" onClick={handleExportAsync}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      }>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Team Performance</SelectItem>
            <SelectItem value="leads">Lead Analysis</SelectItem>
            <SelectItem value="projects">Property Report</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-40"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === "team" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadFunnelChart leads={filteredLeads as any} />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Leaderboard</h3>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : paginatedAgents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No data yet.</div>
                ) : (
                  paginatedAgents.map((agent, i) => (
                    <div key={agent.id} className="flex items-center gap-4">
                      <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">{(page - 1) * 10 + i + 1}</span>
                      <div className="flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-muted-foreground">{agent.conversions} conversions</span>
                        </div>
                        <Progress value={agent.totalLeads > 0 ? Math.round((agent.conversions / agent.totalLeads) * 100) : 0} className="h-2" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-6" />
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {(() => {
                const totalLeads = agentRows.reduce((s, a) => s + a.totalLeads, 0);
                const conversions = agentRows.reduce((s, a) => s + a.conversions, 0);
                const convRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : '0.0';
                const revenue = agentRows.reduce((s, a) => s + (a.revenue || 0), 0);
                const revenueCr = (revenue / 10000000).toFixed(2);
                return (
                  <>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold">{totalLeads}</p><p className="text-sm text-muted-foreground">Total Leads</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-success">{conversions}</p><p className="text-sm text-muted-foreground">Conversions</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-warning">{convRate}%</p><p className="text-sm text-muted-foreground">Avg. Conv. Rate</p></div>
                    <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">₹{revenueCr}Cr</p><p className="text-sm text-muted-foreground">Total Revenue</p></div>
                  </>
                );
              })()}
            </div>
          </Card>
        </div>
      )}

      {reportType === "leads" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LeadFunnelChart leads={filteredLeads as any} /><ProjectPerformanceChart /></div>}
      {reportType === "projects" && <div className="lg:col-span-2"><ProjectPerformanceChart /></div>}
    </PageWrapper>
  );
};
