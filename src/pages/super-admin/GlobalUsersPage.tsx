import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Search, Shield, Briefcase, UserCheck, MoreHorizontal, UserX, Trash2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import type { AuthRole } from "@/stores/appStore";
import { superAdminUsersService } from "@/api";
import { toast } from "sonner";

const roleIcons = { SUPER_ADMIN: Shield, ADMIN: Briefcase, MANAGER: UserCheck, AGENT: Users, CUSTOMER: Users };

type RowUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  tenantId?: string;
  isActive: boolean;
};

export const GlobalUsersPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<RowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await superAdminUsersService.list();
      setUsers((res.data || []) as any);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleToggleActive = async (user: RowUser) => {
    const next = !user.isActive;
    const ok = window.confirm(`${next ? 'Activate' : 'Deactivate'} ${user.name}?`);
    if (!ok) return;
    try {
      await superAdminUsersService.updateStatus(user.id, next);
      toast.success(`User ${next ? 'activated' : 'deactivated'} successfully`);
      await loadUsers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update status';
      toast.error(msg || 'Failed to update status');
    }
  };

  const handleDelete = async (user: RowUser) => {
    const ok = window.confirm(`Delete ${user.name}? This cannot be undone.`);
    if (!ok) return;
    try {
      await superAdminUsersService.delete(user.id);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete user';
      toast.error(msg || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const { page, setPage, totalPages, pageItems: paginatedUsers } = useClientPagination(filteredUsers, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, setPage]);

  return (
    <PageWrapper title="Global Users" description="All users across all tenants." sidebarCollapsed={sidebarCollapsed}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="AGENT">Agent</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="table-container">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => {
              const Icon = roleIcons[user.role] || Users;
              return (
                <TableRow key={user.id} className="hover:bg-table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1"><Icon className="w-3 h-3" />{user.role.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{user.tenantId || "Platform"}</TableCell>
                  <TableCell>
                    <span className={user.isActive ? "status-badge status-available" : "status-badge status-lost"}>
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                          <UserX className="w-4 h-4 mr-2" /> {user.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(user)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        )}
      </motion.div>
    </PageWrapper>
  );
};
