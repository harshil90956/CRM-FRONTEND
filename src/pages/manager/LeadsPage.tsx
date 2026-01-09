import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Download,
  Upload,
  Users,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Zap,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionBottomBar } from "@/components/ui/ActionBottomBar";
import { LeadDetailModal } from "@/components/lead/LeadDetailModal";
import { LeadFiltersBar } from "@/components/leads/LeadFiltersBar";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadCalendarView } from "@/components/leads/LeadCalendarView";
import { ViewMode } from "@/components/leads/ViewToggle";
import { DatePreset } from "@/components/leads/DateRangePicker";
import { downloadCsv, parseCsv, sampleLeadsCsvTemplate } from "@/utils/csv";
import { leadsService, staffService } from "@/api";
import type { LeadDb } from "@/api/services/leads.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isWithinInterval } from "date-fns";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOWUP", label: "Follow Up" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: "bg-blue-50 text-blue-600 border-blue-200",
    CONTACTED: "bg-purple-50 text-purple-600 border-purple-200",
    FOLLOWUP: "bg-yellow-50 text-yellow-600 border-yellow-200",
    QUALIFIED: "bg-green-50 text-green-600 border-green-200",
    NEGOTIATION: "bg-orange-50 text-orange-600 border-orange-200",
    CONVERTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    LOST: "bg-red-50 text-red-600 border-red-200",
  };
  return styles[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

const getPriorityStyle = (priority: string) => {
  const styles: Record<string, string> = {
    High: "bg-red-50 text-red-600",
    Medium: "bg-yellow-50 text-yellow-600",
    Low: "bg-green-50 text-green-600",
  };
  return styles[priority] || "bg-gray-50 text-gray-600";
};

type StaffOption = { id: string; name: string };

export const ManagerLeadsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<(LeadDb & { assignedTo?: string | null })[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [newLeadStaffId, setNewLeadStaffId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("unassigned");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<(LeadDb & { assignedTo?: string | null }) | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    project: "",
    budget: "",
    source: "Website",
    priority: "Medium",
    notes: "",
  });

  const [editLead, setEditLead] = useState({
    name: "",
    email: "",
    phone: "",
    project: "",
    budget: "",
    source: "Website",
    priority: "Medium",
    notes: "",
  });

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await staffService.list({ role: 'AGENT' });
        if (!res.success) {
          throw new Error(res.message || 'Failed to load staff');
        }
        const options = (res.data || [])
          .filter((s) => (s as any).isActive !== false)
          .map((s) => ({ id: s.id, name: s.name }));
        setStaffOptions(options);
        if (!newLeadStaffId && options[0]?.id) {
          setNewLeadStaffId(options[0].id);
        }
      } catch {
        toast.error('Failed to load staff');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    staffOptions.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [staffOptions]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const res = await leadsService.list();
      if (!res.success) {
        throw new Error(res.message || "Failed to load leads");
      }
      const data = (res.data || []).map((l) => {
        const assignedName = staffNameById.get(l.assignedToId || '') || l.assignedToId || null;
        return {
          ...l,
          assignedTo: assignedName,
        };
      });
      setLeads(data);
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.projectId || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const matchesAssigned =
        assignedFilter === "all" ||
        (assignedFilter === "unassigned" ? !lead.assignedToId : lead.assignedToId === assignedFilter);

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const leadDate = new Date(lead.createdAt);
        matchesDate = isWithinInterval(leadDate, { start: dateRange.from, end: dateRange.to });
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesAssigned && matchesDate;
    });
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter, assignedFilter, dateRange]);

  const { page: currentPage, setPage: setCurrentPage, totalPages, pageItems: paginatedLeads } = useClientPagination(filteredLeads, { pageSize: 10 });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, sourceFilter, assignedFilter, dateRange, setCurrentPage]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLeads.map((l) => l.id)));
    }
  };

  const handleExportAll = () => {
    const headers = ["Name", "Email", "Phone", "Project", "Status", "Priority", "Value", "Source", "Assigned To"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.projectId || "",
      lead.status,
      lead.priority || "",
      lead.budget || "",
      lead.source,
      lead.assignedTo || "",
    ]);
    downloadCsv("manager-leads-export", headers, rows);
    toast.success("Leads exported successfully");
  };

  const handleExportByStatus = (status: string) => {
    const filtered = leads.filter((l) => l.status === status);
    const headers = ["Name", "Email", "Phone", "Project", "Status", "Source", "Assigned To"];
    const rows = filtered.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.projectId || "",
      lead.status,
      lead.source,
      lead.assignedTo || "",
    ]);
    downloadCsv(`leads-${status.toLowerCase()}`, headers, rows);
    toast.success(`${status} leads exported`);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    toast.error("Status change is not implemented on backend yet");
  };

  const handleBulkAssign = async (agentId: string) => {
    try {
      const idsToAssign = Array.from(selectedIds);
      await Promise.all(idsToAssign.map((id) => leadsService.assign(id, agentId)));

      setLeads((prev) => prev.filter((l) => !idsToAssign.includes(l.id)));
      setSelectedIds(new Set());
      toast.success(`Assigned ${idsToAssign.length} leads`);
    } catch {
      toast.error("Failed to assign leads");
    }
  };

  const handleBulkDelete = async () => {
    toast.error("Delete is not implemented on backend yet");
  };

  const handleEdit = (lead: any) => {
    setSelectedLead(lead);
    setIsEditOpen(true);
  };

  const handleCall = (lead: any) => {
    toast.info(`Calling ${lead.phone}...`);
    window.open(`tel:${lead.phone}`, '_blank');
  };

  const handleEmail = (lead: any) => {
    toast.info(`Opening email client for ${lead.email}...`);
    window.open(`mailto:${lead.email}`, '_blank');
  };

  const handleDelete = (lead: any) => {
    setSelectedLead(lead);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;
    toast.error("Delete is not implemented on backend yet");
  };

  const handleUpdateLead = async () => {
    if (!selectedLead || !editLead.name || !editLead.email || !editLead.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await leadsService.updateLead(selectedLead.id, {
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        notes: editLead.notes || undefined,
        source: editLead.source || undefined,
        priority: editLead.priority || undefined,
        projectId: editLead.project || undefined,
        budget: editLead.budget || undefined,
      });
      if (!res.success) {
        toast.error(res.message || 'Failed to update lead');
        return;
      }
      // ...
    } catch {
      toast.error("Failed to update lead");
    }
  };

  return (
    <PageWrapper
      title="Leads"
      description="Manage leads"
      sidebarCollapsed={sidebarCollapsed}
    >
      <div />
    </PageWrapper>
  );
};
