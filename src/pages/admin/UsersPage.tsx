import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, UserCog, Search, Filter } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserTable } from "@/components/users/UserTable";
import { AddUserModal } from "@/components/users/AddUserModal";
import { adminUsersService } from "@/api/services/admin-users.service";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useAppStore } from "@/stores/appStore";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "manager" | "agent";
  isActive: boolean;
  createdAt: string;
}

export const UsersPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const fetchUsers = async () => {
    const canFetchAdminUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

    if (!canFetchAdminUsers) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await adminUsersService.list();
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch users");
      }

      const data = res.data || [];
      const filtered = data
        .filter((u) => u.role === "MANAGER" || u.role === "AGENT")
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          role: u.role.toLowerCase() as "manager" | "agent",
          isActive: Boolean(u.isActive),
          createdAt: u.createdAt,
        }));

      setUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser?.role]);

  const handleEdit = (user: User) => {
    setEditUser(user);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditUser(undefined);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { page, setPage, totalPages, pageItems: paginatedUsers } = useClientPagination(filteredUsers, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, setPage]);

  const managers = users.filter((u) => u.role === "manager");
  const agents = users.filter((u) => u.role === "agent");
  const activeUsers = users.filter((u) => u.isActive);

  return (
    <PageWrapper
      title="Users Management"
      description="Manage your managers and agents."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Users"
          value={users.length}
          icon={Users}
          delay={0}
        />
        <KPICard
          title="Managers"
          value={managers.length}
          icon={UserCog}
          iconColor="text-blue-500"
          delay={0.1}
        />
        <KPICard
          title="Agents"
          value={agents.length}
          icon={Users}
          iconColor="text-green-500"
          delay={0.2}
        />
        <KPICard
          title="Active Users"
          value={activeUsers.length}
          icon={Users}
          iconColor="text-success"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <UserTable
          users={paginatedUsers}
          onEdit={handleEdit}
          onRefresh={fetchUsers}
        />
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
      </motion.div>

      {/* Add/Edit Modal */}
      <AddUserModal
        open={showAddModal}
        onOpenChange={handleModalClose}
        onSuccess={fetchUsers}
        editUser={editUser}
      />
    </PageWrapper>
  );
};
