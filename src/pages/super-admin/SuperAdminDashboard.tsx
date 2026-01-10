import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  IndianRupee,
  Activity,
  AlertCircle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentsService, projectsService, superAdminUsersService } from "@/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

type TenantRow = {
  id: string;
  adminUserId: string;
  name: string;
  email: string;
  projects: number;
  users: number;
  subscription: string;
  status: "Active" | "Suspended";
  revenue: string;
};

export const SuperAdminDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalReceivedAmount, setTotalReceivedAmount] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    domain: "",
    subscription: "Business",
  });

  const formatMoney = (amount: number): string => {
    if (!Number.isFinite(amount) || amount <= 0) return "₹0";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    return `₹${Math.round(amount).toLocaleString()}`;
  };

  const makeTenantId = (name: string, domain?: string): string => {
    const base = (domain || name).trim().toLowerCase();
    const slug = base
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
    const suffix = Date.now().toString(36);
    return `tenant_${slug || 'new'}_${suffix}`;
  };

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const [usersRes, projectsRes, paymentsRes] = await Promise.all([
        superAdminUsersService.list(),
        projectsService.list(),
        paymentsService.list(),
      ]);

      const users = usersRes.data || [];
      const projects = projectsRes.data || [];
      const payments = paymentsRes.data || [];

      const byTenant = new Map<string, typeof users>();
      for (const u of users) {
        if (u.role === 'SUPER_ADMIN') continue;
        const arr = byTenant.get(u.tenantId) || [];
        arr.push(u);
        byTenant.set(u.tenantId, arr);
      }

      const projectCountByTenant = new Map<string, number>();
      for (const p of projects) {
        projectCountByTenant.set(p.tenantId, (projectCountByTenant.get(p.tenantId) || 0) + 1);
      }

      const revenueByTenant = new Map<string, number>();
      let totalReceived = 0;
      for (const pay of payments) {
        if (String(pay.status) !== 'Received') continue;
        const amount = pay.amount || 0;
        revenueByTenant.set(pay.tenantId, (revenueByTenant.get(pay.tenantId) || 0) + amount);
        totalReceived += amount;
      }

      const rows: TenantRow[] = [];

      for (const [tenantId, tenantUsers] of byTenant.entries()) {
        const admins = tenantUsers
          .filter((u) => u.role === 'ADMIN')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const admin = admins[0];
        if (!admin) continue;

        rows.push({
          id: tenantId,
          adminUserId: admin.id,
          name: admin.name,
          email: admin.email,
          projects: projectCountByTenant.get(tenantId) || 0,
          users: tenantUsers.length,
          subscription: '—',
          status: admin.isActive ? 'Active' : 'Suspended',
          revenue: formatMoney(revenueByTenant.get(tenantId) || 0),
        });
      }

      rows.sort((a, b) => a.name.localeCompare(b.name));
      setTenants(rows);
      setTotalReceivedAmount(totalReceived);
    } catch (e) {
      setTenants([]);
      setTotalReceivedAmount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "Active").length;
  const totalRevenue = formatMoney(totalReceivedAmount);
  const totalUsers = tenants.reduce((sum, t) => sum + t.users, 0);

  const suspendedTenants = tenants.filter((t) => t.status === 'Suspended');

  const { page, setPage, totalPages, pageItems: paginatedTenants } = useClientPagination(tenants, { pageSize: 10 });

  useEffect(() => {
    void loadTenants();
  }, []);

  const handleAddTenant = async () => {
    if (!newTenant.name || !newTenant.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const tenantId = makeTenantId(newTenant.name, newTenant.domain);
      const res = await superAdminUsersService.create({
        name: newTenant.name,
        email: newTenant.email,
        role: 'ADMIN',
        tenantId,
      });
      if (!res.success) throw new Error(res.message || 'Failed to create tenant');
      toast.success(`Success — Tenant "${newTenant.name}" created`);
      setIsAddDialogOpen(false);
      setNewTenant({ name: "", email: "", domain: "", subscription: "Business" });
      await loadTenants();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Super Admin Dashboard"
      description="Global overview of all tenants and platform metrics."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Building2 className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Tenants" value={totalTenants} change={8} changeLabel="this quarter" icon={Building2} delay={0} />
        <KPICard title="Active Subscriptions" value={activeTenants} icon={Activity} iconColor="text-success" delay={0.1} />
        <KPICard title="Total Users" value={totalUsers} change={15} changeLabel="this month" icon={Users} iconColor="text-info" delay={0.2} />
        <KPICard title="Platform Revenue" value={totalRevenue} change={22} changeLabel="YoY" icon={IndianRupee} iconColor="text-primary" delay={0.3} />
      </div>

      {suspendedTenants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{suspendedTenants.length} tenant(s) are suspended</p>
            <p className="text-xs text-muted-foreground">{suspendedTenants[0].name}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">View Details</Button>
        </motion.div>
      )}

      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart />
      </div>

      {/* Tenants Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="table-container"
      >
        <div className="p-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">All Tenants</h3>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
        </div>
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Tenant</TableHead>
              <TableHead className="font-semibold">Projects</TableHead>
              <TableHead className="font-semibold">Users</TableHead>
              <TableHead className="font-semibold">Subscription</TableHead>
              <TableHead className="font-semibold">Revenue</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenants.map((tenant, index) => (
              <motion.tr
                key={tenant.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-table-row-hover transition-colors"
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{tenant.projects}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.users}</TableCell>
                <TableCell><Badge variant="outline">{tenant.subscription}</Badge></TableCell>
                <TableCell className="font-medium">{tenant.revenue}</TableCell>
                <TableCell>
                  <span className={cn("status-badge", tenant.status === "Active" ? "status-available" : "status-lost")}>
                    {tenant.status}
                  </span>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </motion.div>

      {/* Add Tenant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>Create a new builder company tenant on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Company Name *</Label>
              <Input
                id="tenant-name"
                placeholder="e.g., Prestige Group"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-email">Admin Email *</Label>
              <Input
                id="tenant-email"
                type="email"
                placeholder="admin@company.com"
                value={newTenant.email}
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-domain">Domain (optional)</Label>
              <Input
                id="tenant-domain"
                placeholder="company.com"
                value={newTenant.domain}
                onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={newTenant.subscription} onValueChange={(v) => setNewTenant({ ...newTenant, subscription: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTenant} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
