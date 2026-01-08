import { useState } from "react";
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
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const SuperAdminDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { tenants, addTenant, isLoading } = useAppStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    domain: "",
    subscription: "Business",
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "Active").length;
  const totalRevenue = "₹469 Cr";
  const totalUsers = tenants.reduce((sum, t) => sum + t.users, 0);

  const { page, setPage, totalPages, pageItems: paginatedTenants } = useClientPagination(tenants, { pageSize: 10 });

  const handleAddTenant = async () => {
    if (!newTenant.name || !newTenant.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    await addTenant({
      name: newTenant.name,
      email: newTenant.email,
      projects: 0,
      users: 1,
      subscription: newTenant.subscription,
      status: "Active",
      revenue: "₹0",
    });
    
    toast.success(`Success — Tenant "${newTenant.name}" created`);
    setIsAddDialogOpen(false);
    setNewTenant({ name: "", email: "", domain: "", subscription: "Business" });
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

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">1 tenant has been suspended</p>
          <p className="text-xs text-muted-foreground">Sobha Developers - Payment overdue for 45 days</p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">View Details</Button>
      </motion.div>

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
