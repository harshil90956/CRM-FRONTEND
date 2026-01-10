import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Search, Plus, MoreHorizontal, Eye, Edit, UserX } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { paymentsService, projectsService, superAdminUsersService } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

type TenantRow = {
  id: string;
  adminUserId: string;
  name: string;
  email: string;
  domain?: string;
  projects: number;
  users: number;
  subscription: string;
  status: "Active" | "Suspended";
  revenue: string;
};

export const TenantsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [newTenant, setNewTenant] = useState({ name: "", email: "", domain: "", subscription: "Business" });
  const [editTenant, setEditTenant] = useState({ name: "", email: "", domain: "", subscription: "Business" });

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
      for (const pay of payments) {
        if (String(pay.status) !== 'Received') continue;
        revenueByTenant.set(pay.tenantId, (revenueByTenant.get(pay.tenantId) || 0) + (pay.amount || 0));
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
          domain: undefined,
          projects: projectCountByTenant.get(tenantId) || 0,
          users: tenantUsers.length,
          subscription: '—',
          status: admin.isActive ? 'Active' : 'Suspended',
          revenue: formatMoney(revenueByTenant.get(tenantId) || 0),
        });
      }

      rows.sort((a, b) => a.name.localeCompare(b.name));
      setTenants(rows);
    } catch (e) {
      setTenants([]);
      toast.error(e instanceof Error ? e.message : 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, totalPages, pageItems: paginatedTenants } = useClientPagination(filteredTenants, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

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

  const handleToggleStatus = async (tenant: TenantRow) => {
    setIsLoading(true);
    try {
      const nextActive = tenant.status !== 'Active';
      const res = await superAdminUsersService.updateStatus(tenant.adminUserId, nextActive);
      if (!res.success) throw new Error(res.message || 'Failed to update status');
      toast.success(nextActive ? 'Tenant activated' : 'Tenant suspended');
      await loadTenants();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setEditTenant({
      name: tenant.name,
      email: tenant.email,
      domain: tenant.domain || "",
      subscription: tenant.subscription
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTenant = async () => {
    toast.error('Editing tenant details is not supported by the backend yet');
    setIsEditDialogOpen(false);
    setSelectedTenant(null);
    setEditTenant({ name: "", email: "", domain: "", subscription: "Business" });
  };

  return (
    <PageWrapper title="Tenants" description="Manage all builder companies on the platform." sidebarCollapsed={sidebarCollapsed}
      actions={<Button size="sm" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Tenant</Button>}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 min-w-0 sm:min-w-[250px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tenants..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="table-container">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead>Tenant</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTenants.map((tenant) => (
              <TableRow key={tenant.id} className="hover:bg-table-row-hover">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{tenant.projects}</TableCell>
                <TableCell>{tenant.users}</TableCell>
                <TableCell><Badge variant="outline">{tenant.subscription}</Badge></TableCell>
                <TableCell className="font-medium">{tenant.revenue}</TableCell>
                <TableCell>
                  <span className={cn("status-badge", tenant.status === "Active" ? "status-available" : "status-lost")}>{tenant.status}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleToggleStatus(tenant)}>
                        <UserX className="w-4 h-4 mr-2" />
                        {tenant.status === 'Active' ? 'Suspend' : 'Activate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        )}
        {!isLoading && filteredTenants.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">No tenants yet. Create your first tenant to get started.</div>
        )}
      </motion.div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>Create a new builder company tenant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Company Name *</Label><Input placeholder="e.g., Prestige Group" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Admin Email *</Label><Input type="email" placeholder="admin@company.com" value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Domain (optional)</Label><Input placeholder="company.com" value={newTenant.domain} onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={newTenant.subscription} onValueChange={(v) => setNewTenant({ ...newTenant, subscription: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleAddTenant} disabled={isLoading}>{isLoading ? "Creating..." : "Create Tenant"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>View complete information about this tenant.</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="font-semibold">{selectedTenant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin Email</p>
                  <p className="font-semibold">{selectedTenant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Domain</p>
                  <p className="font-semibold">{selectedTenant.domain || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                  <Badge variant="outline">{selectedTenant.subscription}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Projects</p>
                  <p className="font-semibold">{selectedTenant.projects}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Users</p>
                  <p className="font-semibold">{selectedTenant.users}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="font-semibold">{selectedTenant.revenue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={cn("status-badge", selectedTenant.status === "Active" ? "status-available" : "status-lost")}>
                    {selectedTenant.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="e.g., Prestige Group" value={editTenant.name} onChange={(e) => setEditTenant({ ...editTenant, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Admin Email *</Label>
              <Input type="email" placeholder="admin@company.com" value={editTenant.email} onChange={(e) => setEditTenant({ ...editTenant, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Domain (optional)</Label>
              <Input placeholder="company.com" value={editTenant.domain} onChange={(e) => setEditTenant({ ...editTenant, domain: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={editTenant.subscription} onValueChange={(v) => setEditTenant({ ...editTenant, subscription: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleUpdateTenant} disabled={isLoading}>{isLoading ? "Updating..." : "Update Tenant"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
