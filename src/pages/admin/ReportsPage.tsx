import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Download, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Clock,
  TrendingDown
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/utils/csv";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { adminReportsService, projectsService } from "@/api";
import type { ReportsOverview } from "@/api/services/admin-reports.service";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// KPI Card matching the reference design
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  valueColor?: string;
}

const ReportKPICard = ({ title, value, subtitle, icon, iconColor, valueColor }: KPICardProps) => (
  <Card className="p-5 border border-border bg-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${valueColor || 'text-foreground'}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`${iconColor || 'text-muted-foreground'}`}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

// Real Estate Stock/Inventory data
// (Data for this page is fetched from backend via /admin/reports/overview)

export const ReportsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [activeTab, setActiveTab] = useState("stock");
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('all');

  const loadProjects = async () => {
    try {
      const res = await projectsService.list();
      const list = res.data || [];
      setProjects(list.map((p) => ({ id: p.id, name: p.name })));
    } catch {
      setProjects([]);
    }
  };

  const loadOverview = async (opts?: { from?: string; to?: string; projectId?: string }) => {
    setIsLoading(true);
    try {
      const res = await adminReportsService.overview(opts);
      setOverview(res.data || null);
    } catch (e) {
      setOverview(null);
      toast.error(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryData = useMemo(() => {
    const rows = overview?.breakdowns?.inventoryByMainType || [];
    const iconFor = (t: string) => {
      const key = String(t).toLowerCase();
      if (key.includes('res')) return '🏢';
      if (key.includes('com')) return '🏪';
      if (key.includes('ind')) return '🏭';
      return '🏘️';
    };
    return rows.map((r) => ({
      icon: iconFor(r.mainType),
      category: String(r.mainType),
      items: Number(r.units || 0),
      quantity: Number(r.units || 0),
      value: Number(r.value || 0),
    }));
  }, [overview]);

  const salesData = useMemo(() => {
    const rows = overview?.top?.projectsByRevenue || [];
    const leadsByProject = new Map(
      (overview?.top?.projectsByLeads || []).map((p) => [String(p.projectId), Number(p.leads || 0)]),
    );
    return rows.map((r) => {
      const leads = leadsByProject.get(String(r.projectId)) || 0;
      const revenue = Number(r.revenue || 0);
      const units = 0;
      const avgPrice = 0;
      return { project: String(r.name), units, revenue, avgPrice, leads } as any;
    });
  }, [overview]);

  const purchaseData = useMemo(() => {
    const rows = overview?.breakdowns?.leadSource || [];
    return rows.map((r) => ({ vendor: String(r.key), material: 'Leads', quantity: Number(r.count || 0), value: Number(r.count || 0) }));
  }, [overview]);

  const financialData = useMemo(() => {
    const months = overview?.charts?.months || [];
    const revenue = overview?.charts?.revenueReceived || [];
    return months.map((m, idx) => {
      const income = Number(revenue[idx] || 0);
      return { month: String(m), income, expenses: 0, profit: income };
    });
  }, [overview]);

  const staffData = useMemo(() => {
    const rows = overview?.top?.staffByRevenue || [];
    return rows.map((r) => ({
      name: String(r.name),
      role: String(r.role),
      leads: Number(r.leadsAssigned || 0),
      conversions: Number(r.convertedLeads || 0),
      revenue: Number(r.revenue || 0),
    }));
  }, [overview]);

  const trendData = useMemo(() => {
    const months = overview?.charts?.months || [];
    const leads = overview?.charts?.leadsCreated || [];
    const bookings = overview?.charts?.bookingsCreated || [];
    const revenue = overview?.charts?.revenueReceived || [];
    return months.map((m, idx) => ({
      month: String(m),
      leads: Number(leads[idx] || 0),
      bookings: Number(bookings[idx] || 0),
      revenueCr: Number(((Number(revenue[idx] || 0)) / 10000000).toFixed(2)),
    }));
  }, [overview]);

  const { page: stockPage, setPage: setStockPage, totalPages: stockTotalPages, pageItems: paginatedCategoryData } = useClientPagination(categoryData, { pageSize: 10 });
  const { page: salesPage, setPage: setSalesPage, totalPages: salesTotalPages, pageItems: paginatedSalesData } = useClientPagination(salesData, { pageSize: 10 });
  const { page: purchasePage, setPage: setPurchasePage, totalPages: purchaseTotalPages, pageItems: paginatedPurchaseData } = useClientPagination(purchaseData, { pageSize: 10 });
  const { page: financialPage, setPage: setFinancialPage, totalPages: financialTotalPages, pageItems: paginatedFinancialData } = useClientPagination(financialData, { pageSize: 10 });
  const { page: staffPage, setPage: setStaffPage, totalPages: staffTotalPages, pageItems: paginatedStaffData } = useClientPagination(staffData, { pageSize: 10 });

  useEffect(() => {
    setStockPage(1);
    setSalesPage(1);
    setPurchasePage(1);
    setFinancialPage(1);
    setStaffPage(1);
  }, [activeTab, setStockPage, setSalesPage, setPurchasePage, setFinancialPage, setStaffPage]);

  const totalStockValue = overview?.kpis?.units?.inventoryValue ?? categoryData.reduce((sum, c) => sum + c.value, 0);
  const totalItems = overview?.kpis?.units?.total ?? categoryData.reduce((sum, c) => sum + c.items, 0);
  const totalQuantity = overview?.kpis?.units?.total ?? categoryData.reduce((sum, c) => sum + c.quantity, 0);

  const handleExportReport = () => {
    if (activeTab === "stock") {
      const headers = ["Category", "Items", "Total Quantity", "Stock Value"];
      const rows = categoryData.map(c => [c.category, c.items, c.quantity, c.value]);
      rows.push(["Total", totalItems, totalQuantity, totalStockValue]);
      downloadCsv("stock-report", headers, rows);
    } else if (activeTab === "sales") {
      const headers = ["Project", "Leads", "Revenue"];
      const rows = salesData.map((s: any) => [s.project, s.leads ?? 0, s.revenue]);
      downloadCsv("sales-report", headers, rows);
    } else if (activeTab === "purchase") {
      const headers = ["Lead Source", "Leads"];
      const rows = purchaseData.map(p => [p.vendor, p.quantity]);
      downloadCsv("purchase-report", headers, rows);
    } else if (activeTab === "financial") {
      const headers = ["Month", "Income", "Expenses", "Profit"];
      const rows = financialData.map(f => [f.month, f.income, f.expenses, f.profit]);
      downloadCsv("financial-report", headers, rows);
    } else if (activeTab === "staff") {
      const headers = ["Name", "Role", "Leads", "Conversions", "Revenue"];
      const rows = staffData.map(s => [s.name, s.role, s.leads, s.conversions, s.revenue]);
      downloadCsv("staff-report", headers, rows);
    }
    toast.success("Report exported successfully");
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatCr = (value: number) => {
    const cr = Number(value || 0) / 10000000;
    return `₹${cr.toFixed(2)}Cr`;
  };

  const pct = (num: number, den: number) => {
    if (!den || den <= 0) return '0%';
    return `${((num / den) * 100).toFixed(1)}%`;
  };

  const handleApplyFilters = () => {
    void loadOverview({
      from: from || undefined,
      to: to || undefined,
      projectId: projectId === 'all' ? undefined : projectId,
    });
  };

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setProjectId('all');
    void loadOverview();
  };

  const k = overview?.kpis;
  const totalRevenue = Number(k?.payments?.receivedAmount || 0);
  const totalReceivables = Number(k?.payments?.pendingAmount || 0) + Number(k?.payments?.overdueAmount || 0);
  const totalLeads = Number(k?.leads?.total || 0);
  const totalConverted = Number(k?.leads?.converted || 0);
  const totalBookingsBooked = Number(k?.bookings?.booked || 0);
  const avgDealSize = totalBookingsBooked > 0 ? totalRevenue / totalBookingsBooked : 0;
  const conversionRate = pct(totalConverted, totalLeads);
  const collectionRate = pct(totalRevenue, totalRevenue + totalReceivables);

  const topLeadSource = useMemo(() => {
    const rows = overview?.breakdowns?.leadSource || [];
    if (rows.length === 0) return { key: 'N/A', count: 0 };
    return rows.reduce(
      (best, r) => (Number(r.count || 0) > Number(best.count || 0) ? (r as any) : best),
      rows[0] as any,
    ) as any;
  }, [overview]);

  return (
    <PageWrapper
      title="Reports & Analytics"
      description="Comprehensive reports across all business modules"
      sidebarCollapsed={sidebarCollapsed}
    >
      <Card className="p-4 mb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <div>
              <div className="text-xs text-muted-foreground mb-1">From</div>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">To</div>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Project</div>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="w-full">Apply</Button>
              <Button onClick={handleResetFilters} variant="outline" className="w-full">Reset</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Business Trends</h3>
            <p className="text-sm text-muted-foreground">Leads, bookings, and revenue over time</p>
          </div>
          <div className="text-sm text-muted-foreground">{isLoading ? 'Loading…' : ''}</div>
        </div>
        <div className="h-72">
          {!isLoading && trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">No trend data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="revenueCr" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 gap-0 flex flex-wrap">
          <TabsTrigger 
            value="stock" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
          >
            Stock Reports
          </TabsTrigger>
          <TabsTrigger 
            value="sales"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
          >
            Sales Reports
          </TabsTrigger>
          <TabsTrigger 
            value="purchase"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
          >
            Purchase Reports
          </TabsTrigger>
          <TabsTrigger 
            value="financial"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
          >
            Financial Reports
          </TabsTrigger>
          <TabsTrigger 
            value="staff"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5"
          >
            Staff Reports
          </TabsTrigger>
        </TabsList>

        {/* Stock Reports Tab */}
        <TabsContent value="stock" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPICard 
                  title="Total Stock Value" 
                  value={formatCurrency(totalStockValue)}
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <ReportKPICard 
                  title="Total Items" 
                  value={totalItems}
                  icon={<Package className="w-5 h-5" />}
                />
                <ReportKPICard 
                  title="Available Units" 
                  value={Number(k?.units?.available || 0)}
                  valueColor="text-green-600"
                  icon={<TrendingDown className="w-5 h-5 text-green-600" />}
                />
                <ReportKPICard 
                  title="Sold Units" 
                  value={Number(k?.units?.sold || 0)}
                  icon={<AlertTriangle className="w-5 h-5" />}
                />
              </div>

              {/* Category Table */}
              <Card className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-lg font-semibold">Category-wise Stock Valuation</h3>
                  <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Category</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Items</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Total Quantity</TableHead>
                      <TableHead className="text-right text-muted-foreground font-medium">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategoryData.map((category) => (
                      <TableRow key={category.category} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="font-medium">{category.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>{category.items}</TableCell>
                        <TableCell>{category.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.value)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                      <TableCell>Total</TableCell>
                      <TableCell>{totalItems}</TableCell>
                      <TableCell>{totalQuantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalStockValue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <PaginationBar page={stockPage} totalPages={stockTotalPages} onPageChange={setStockPage} className="px-0" />
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPICard title="Revenue Collected" value={formatCr(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} />
                <ReportKPICard title="Bookings Booked" value={Number(k?.bookings?.booked || 0)} icon={<Package className="w-5 h-5" />} />
                <ReportKPICard title="Avg Deal Size" value={formatCurrency(Math.round(avgDealSize))} icon={<DollarSign className="w-5 h-5" />} />
                <ReportKPICard title="Conversion Rate" value={conversionRate} valueColor="text-green-600" />
              </div>
              <Card className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-lg font-semibold">Project-wise Revenue</h3>
                  <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />Export Report
                  </Button>
                </div>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesData.map((s: any) => (
                      <TableRow key={s.project}>
                        <TableCell className="font-medium">{s.project}</TableCell>
                        <TableCell>{Number(s.leads || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(s.revenue || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar page={salesPage} totalPages={salesTotalPages} onPageChange={setSalesPage} className="px-0" />
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Purchase Reports Tab */}
        <TabsContent value="purchase" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPICard title="Total Leads" value={totalLeads} icon={<Package className="w-5 h-5" />} />
                <ReportKPICard title="Top Source" value={String((topLeadSource as any)?.key || 'N/A')} icon={<Clock className="w-5 h-5" />} />
                <ReportKPICard title="Qualified Leads" value={Number(k?.leads?.qualified || 0)} valueColor="text-green-600" />
                <ReportKPICard title="Converted Leads" value={totalConverted} valueColor="text-green-600" />
              </div>
              <Card className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-lg font-semibold">Lead Sources</h3>
                  <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />Export Report
                  </Button>
                </div>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPurchaseData.map((p) => (
                      <TableRow key={p.vendor}>
                        <TableCell className="font-medium">{p.vendor}</TableCell>
                        <TableCell className="text-right">{Number(p.quantity || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar page={purchasePage} totalPages={purchaseTotalPages} onPageChange={setPurchasePage} className="px-0" />
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPICard title="Revenue Collected" value={formatCr(totalRevenue)} valueColor="text-green-600" icon={<DollarSign className="w-5 h-5 text-green-600" />} />
                <ReportKPICard title="Pending" value={formatCr(Number(k?.payments?.pendingAmount || 0))} valueColor="text-orange-500" />
                <ReportKPICard title="Overdue" value={formatCr(Number(k?.payments?.overdueAmount || 0))} valueColor="text-red-500" />
                <ReportKPICard title="Collection Rate" value={collectionRate} valueColor="text-green-600" />
              </div>
              <Card className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-lg font-semibold">Monthly Collections</h3>
                  <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Export Report</Button>
                </div>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFinancialData.map((f) => (
                      <TableRow key={f.month}>
                        <TableCell className="font-medium">{f.month}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(Number(f.income || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar page={financialPage} totalPages={financialTotalPages} onPageChange={setFinancialPage} className="px-0" />
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Staff Reports Tab */}
        <TabsContent value="staff" className="mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportKPICard title="Total Staff" value={Number(k?.users?.total || 0)} icon={<Package className="w-5 h-5" />} />
                <ReportKPICard title="Active Agents" value={Number(k?.users?.agents || 0)} />
                <ReportKPICard title="Leads Created" value={totalLeads} />
                <ReportKPICard title="Conversion Rate" value={conversionRate} valueColor="text-green-600" />
              </div>
              <Card className="p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-lg font-semibold">Staff Performance</h3>
                  <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Export Report</Button>
                </div>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Leads Assigned</TableHead>
                      <TableHead>Converted</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStaffData.map((s) => (
                      <TableRow key={`${s.name}-${s.role}`}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell>{Number(s.leads || 0)}</TableCell>
                        <TableCell>{Number(s.conversions || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(s.revenue || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar page={staffPage} totalPages={staffTotalPages} onPageChange={setStaffPage} className="px-0" />
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
