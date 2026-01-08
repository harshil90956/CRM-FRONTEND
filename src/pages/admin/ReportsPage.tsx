import { useState, useEffect } from "react";
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
const categoryData = [
  { icon: "🏢", category: "Residential Units", items: 245, quantity: 245, value: 1845000000 },
  { icon: "🏪", category: "Commercial Units", items: 68, quantity: 68, value: 896000000 },
  { icon: "🏭", category: "Industrial Units", items: 32, quantity: 32, value: 448000000 },
  { icon: "🏘️", category: "Villa Projects", items: 15, quantity: 15, value: 675000000 },
];

// Real estate specific data for other tabs
const salesData = [
  { project: "Green Valley", units: 45, revenue: 38250000, avgPrice: 8500000 },
  { project: "Sky Heights", units: 32, revenue: 57600000, avgPrice: 18000000 },
  { project: "Palm Residency", units: 28, revenue: 89600000, avgPrice: 32000000 },
  { project: "Business Park One", units: 15, revenue: 18000000, avgPrice: 12000000 },
];

const purchaseData = [
  { vendor: "ABC Construction", material: "Cement", quantity: 5000, value: 2500000 },
  { vendor: "Steel Corp", material: "Steel", quantity: 200, value: 4000000 },
  { vendor: "Tiles Plus", material: "Tiles", quantity: 10000, value: 1500000 },
  { vendor: "Paint World", material: "Paint", quantity: 500, value: 250000 },
  { vendor: "Electro Supplies", material: "Electrical Fittings", quantity: 300, value: 450000 },
  { vendor: "Plumb Pro", material: "Plumbing Materials", quantity: 150, value: 375000 },
];

const financialData = [
  { month: "January", income: 45000000, expenses: 12000000, profit: 33000000 },
  { month: "February", income: 52000000, expenses: 15000000, profit: 37000000 },
  { month: "March", income: 48000000, expenses: 13000000, profit: 35000000 },
  { month: "April", income: 61000000, expenses: 18000000, profit: 43000000 },
];

const staffData = [
  { name: "Rahul Verma", role: "Agent", leads: 45, conversions: 12, revenue: 85000000 },
  { name: "Neha Gupta", role: "Agent", leads: 38, conversions: 8, revenue: 52000000 },
  { name: "Priya Singh", role: "Manager", leads: 120, conversions: 28, revenue: 180000000 },
  { name: "Suresh Kumar", role: "Agent", leads: 32, conversions: 6, revenue: 41000000 },
];

export const ReportsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [activeTab, setActiveTab] = useState("stock");
  const [isLoading, setIsLoading] = useState(true);

  const { page: stockPage, setPage: setStockPage, totalPages: stockTotalPages, pageItems: paginatedCategoryData } = useClientPagination(categoryData, { pageSize: 10 });
  const { page: salesPage, setPage: setSalesPage, totalPages: salesTotalPages, pageItems: paginatedSalesData } = useClientPagination(salesData, { pageSize: 10 });
  const { page: purchasePage, setPage: setPurchasePage, totalPages: purchaseTotalPages, pageItems: paginatedPurchaseData } = useClientPagination(purchaseData, { pageSize: 10 });
  const { page: financialPage, setPage: setFinancialPage, totalPages: financialTotalPages, pageItems: paginatedFinancialData } = useClientPagination(financialData, { pageSize: 10 });
  const { page: staffPage, setPage: setStaffPage, totalPages: staffTotalPages, pageItems: paginatedStaffData } = useClientPagination(staffData, { pageSize: 10 });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    setStockPage(1);
    setSalesPage(1);
    setPurchasePage(1);
    setFinancialPage(1);
    setStaffPage(1);
  }, [activeTab, setStockPage, setSalesPage, setPurchasePage, setFinancialPage, setStaffPage]);

  const totalStockValue = categoryData.reduce((sum, c) => sum + c.value, 0);
  const totalItems = categoryData.reduce((sum, c) => sum + c.items, 0);
  const totalQuantity = categoryData.reduce((sum, c) => sum + c.quantity, 0);

  const handleExportReport = () => {
    if (activeTab === "stock") {
      const headers = ["Category", "Items", "Total Quantity", "Stock Value"];
      const rows = categoryData.map(c => [c.category, c.items, c.quantity, c.value]);
      rows.push(["Total", totalItems, totalQuantity, totalStockValue]);
      downloadCsv("stock-report", headers, rows);
    } else if (activeTab === "sales") {
      const headers = ["Project", "Units Sold", "Revenue", "Avg Price"];
      const rows = salesData.map(s => [s.project, s.units, s.revenue, s.avgPrice]);
      downloadCsv("sales-report", headers, rows);
    } else if (activeTab === "purchase") {
      const headers = ["Vendor", "Material", "Quantity", "Value"];
      const rows = purchaseData.map(p => [p.vendor, p.material, p.quantity, p.value]);
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

  return (
    <PageWrapper
      title="Reports & Analytics"
      description="Comprehensive reports across all business modules"
      sidebarCollapsed={sidebarCollapsed}
    >
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
                  title="Low Stock Items" 
                  value={0}
                  valueColor="text-orange-500"
                  icon={<TrendingDown className="w-5 h-5 text-orange-500" />}
                />
                <ReportKPICard 
                  title="Expiring Soon" 
                  value={2}
                  valueColor="text-orange-500"
                  icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportKPICard title="Total Revenue" value="₹20.34Cr" icon={<DollarSign className="w-5 h-5" />} />
              <ReportKPICard title="Units Sold" value="120" icon={<Package className="w-5 h-5" />} />
              <ReportKPICard title="Avg Deal Size" value="₹16.95L" icon={<DollarSign className="w-5 h-5" />} />
              <ReportKPICard title="Conversion Rate" value="24.5%" valueColor="text-green-600" />
            </div>
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold">Project-wise Sales</h3>
                <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />Export Report
                </Button>
              </div>
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow><TableHead>Project</TableHead><TableHead>Units Sold</TableHead><TableHead>Revenue</TableHead><TableHead className="text-right">Avg Price</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesData.map((s) => (
                    <TableRow key={s.project}>
                      <TableCell className="font-medium">{s.project}</TableCell>
                      <TableCell>{s.units}</TableCell>
                      <TableCell>{formatCurrency(s.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.avgPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar page={salesPage} totalPages={salesTotalPages} onPageChange={setSalesPage} className="px-0" />
            </Card>
          </motion.div>
        </TabsContent>

        {/* Purchase Reports Tab */}
        <TabsContent value="purchase" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportKPICard title="Total Purchases" value="₹82.5L" icon={<DollarSign className="w-5 h-5" />} />
              <ReportKPICard title="Vendors" value="12" icon={<Package className="w-5 h-5" />} />
              <ReportKPICard title="Pending Orders" value="5" valueColor="text-orange-500" />
              <ReportKPICard title="This Month" value="₹25.6L" />
            </div>
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold">Vendor-wise Purchases</h3>
                <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Export Report</Button>
              </div>
              <Table className="min-w-[900px]">
                <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Material</TableHead><TableHead>Quantity</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedPurchaseData.map((p) => (
                    <TableRow key={p.vendor}><TableCell className="font-medium">{p.vendor}</TableCell><TableCell>{p.material}</TableCell><TableCell>{p.quantity.toLocaleString()}</TableCell><TableCell className="text-right">{formatCurrency(p.value)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar page={purchasePage} totalPages={purchaseTotalPages} onPageChange={setPurchasePage} className="px-0" />
            </Card>
          </motion.div>
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportKPICard title="Total Income" value="₹20.6Cr" valueColor="text-green-600" icon={<DollarSign className="w-5 h-5 text-green-600" />} />
              <ReportKPICard title="Total Expenses" value="₹5.8Cr" valueColor="text-red-500" />
              <ReportKPICard title="Net Profit" value="₹14.8Cr" valueColor="text-green-600" />
              <ReportKPICard title="Profit Margin" value="71.8%" valueColor="text-green-600" />
            </div>
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold">Monthly Financial Summary</h3>
                <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Export Report</Button>
              </div>
              <Table className="min-w-[900px]">
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Income</TableHead><TableHead>Expenses</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedFinancialData.map((f) => (
                    <TableRow key={f.month}><TableCell className="font-medium">{f.month}</TableCell><TableCell className="text-green-600">{formatCurrency(f.income)}</TableCell><TableCell className="text-red-500">{formatCurrency(f.expenses)}</TableCell><TableCell className="text-right font-semibold text-green-600">{formatCurrency(f.profit)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar page={financialPage} totalPages={financialTotalPages} onPageChange={setFinancialPage} className="px-0" />
            </Card>
          </motion.div>
        </TabsContent>

        {/* Staff Reports Tab */}
        <TabsContent value="staff" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportKPICard title="Total Staff" value="25" icon={<Package className="w-5 h-5" />} />
              <ReportKPICard title="Active Agents" value="12" />
              <ReportKPICard title="Total Leads Handled" value="235" />
              <ReportKPICard title="Avg Conversion" value="22.8%" valueColor="text-green-600" />
            </div>
            <Card className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold">Staff Performance</h3>
                <Button onClick={handleExportReport} className="w-full sm:w-auto bg-green-600 hover:bg-green-700"><Download className="w-4 h-4 mr-2" />Export Report</Button>
              </div>
              <Table className="min-w-[900px]">
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Leads</TableHead><TableHead>Conversions</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedStaffData.map((s) => (
                    <TableRow key={s.name}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.role}</TableCell><TableCell>{s.leads}</TableCell><TableCell>{s.conversions}</TableCell><TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar page={staffPage} totalPages={staffTotalPages} onPageChange={setStaffPage} className="px-0" />
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
