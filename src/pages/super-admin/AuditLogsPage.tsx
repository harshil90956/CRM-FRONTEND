import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, PhoneCall, Mail, Calendar, StickyNote } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { superAdminUsersService } from "@/api";

type ActivityType = 'call' | 'email' | 'meeting' | 'note';

type AuditLogRow = {
  id: string;
  action: string;
  user: string;
  target: string;
  time: string;
  sortKey: number;
  icon: any;
  type: ActivityType;
};

const typeColors: Record<ActivityType, string> = {
  call: "text-info",
  email: "text-primary",
  meeting: "text-warning",
  note: "text-muted-foreground",
};

const typeIcons: Record<ActivityType, any> = {
  call: PhoneCall,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

export const AuditLogsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const usersRes = await superAdminUsersService.list();
        const users = usersRes.data || [];

        const activityResults = await Promise.all(
          users.map(async (u) => {
            try {
              const res = await superAdminUsersService.activity(u.id);
              return {
                user: u,
                activities: res.data || [],
              };
            } catch {
              return {
                user: u,
                activities: [],
              };
            }
          }),
        );

        const allLogs: AuditLogRow[] = [];
        for (const item of activityResults) {
          for (const a of item.activities) {
            const d = new Date(a.createdAt);
            const rawType = String(a.type) as ActivityType;
            const type: ActivityType = rawType in typeIcons ? rawType : 'note';
            const sortKey = Number.isFinite(d.getTime()) ? d.getTime() : 0;
            const time = Number.isFinite(d.getTime())
              ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
              : a.createdAt;

            allLogs.push({
              id: a.id,
              action: a.message || String(a.type),
              user: item.user.email || item.user.name,
              target: a.leadId ? `Lead ${a.leadId}` : a.tenantId,
              time,
              sortKey,
              icon: typeIcons[type] || StickyNote,
              type,
            });
          }
        }

        allLogs.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
        setLogs(allLogs);
      } catch {
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Action", "User", "Target", "Time", "Type"],
      ...filteredLogs.map(log => [
        log.id,
        log.action,
        log.user,
        log.target,
        log.time,
        log.type
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const { page, setPage, totalPages, pageItems: paginatedLogs } = useClientPagination(filteredLogs, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, setPage]);

  return (
    <PageWrapper title="Audit Logs" description="Track all platform activities and changes." sidebarCollapsed={sidebarCollapsed}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport}><Filter className="w-4 h-4 mr-2" />Export</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        )}
        {!isLoading && filteredLogs.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">No activity logs yet.</div>
        )}
        {paginatedLogs.map((log) => (
          <div key={log.id} className="card-elevated p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted ${typeColors[log.type as keyof typeof typeColors]}`}>
              <log.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{log.action}</p>
              <p className="text-sm text-muted-foreground">by {log.user} → {log.target}</p>
            </div>
            <Badge variant="outline">{log.type}</Badge>
            <span className="text-sm text-muted-foreground">{log.time}</span>
          </div>
        ))}
      </motion.div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
    </PageWrapper>
  );
};
