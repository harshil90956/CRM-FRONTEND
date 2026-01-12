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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { leadsService } from "@/api";
import type { AllowedLeadActions, LeadField, ManagerLead } from "@/api/services/leads.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { isWithinInterval } from "date-fns";
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

const statusLabel = (status: string) => {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'CONTACTED':
      return 'Contacted';
    case 'FOLLOWUP':
      return 'Follow Up';
    case 'NEGOTIATION':
      return 'Negotiation';
    case 'CONVERTED':
      return 'Converted';
    case 'LOST':
      return 'Lost';
    default:
      return status;
  }
};

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
type ProjectOption = { id: string; name: string };

export const ManagerLeadsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<ManagerLead[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [newLeadStaffId, setNewLeadStaffId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<ManagerLead | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [statusList, setStatusList] = useState<string[]>([]);
  const [allowedActionsById, setAllowedActionsById] = useState<Record<string, AllowedLeadActions>>({});
  const [importCsv, setImportCsv] = useState("");
  const [importProjectId, setImportProjectId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllowedActionsForLead = (id: string): AllowedLeadActions => {
    return (
      allowedActionsById[id] || {
        canEdit: true,
        canAssign: true,
        canChangeStatus: true,
        canDelete: true,
      }
    );
  };

  const detailLead = useMemo(() => {
    if (!selectedLead) return null;
    return {
      ...(selectedLead as any),
      projectId: selectedLead.project?.name || null,
      assignedTo: selectedLead.assignedTo?.name || null,
    } as any;
  }, [selectedLead]);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    projectId: "",
    budget: "",
    source: "Website",
    priority: "Medium",
    notes: "",
  });

  const [addLeadStep, setAddLeadStep] = useState<'project' | 'details'>('project');

  const [editLead, setEditLead] = useState({
    name: "",
    email: "",
    phone: "",
    projectId: "",
    assignedToId: "",
    budget: "",
    source: "Website",
    priority: "Medium",
    notes: "",
  });

  const [newLeadFields, setNewLeadFields] = useState<LeadField[]>([]);
  const [editLeadFields, setEditLeadFields] = useState<LeadField[]>([]);
  const [listLeadFields, setListLeadFields] = useState<LeadField[]>([]);
  const [newDynamicData, setNewDynamicData] = useState<Record<string, any>>({});
  const [editDynamicData, setEditDynamicData] = useState<Record<string, any>>({});

  const loadLeadFields = async (projectId: string | null, mode: 'new' | 'edit', existing?: Record<string, any> | null) => {
    try {
      const res = await leadsService.listLeadFields(projectId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load lead fields');
      }
      const fields = (res.data || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (mode === 'new') {
        setNewLeadFields(fields);
        setNewDynamicData(existing || {});
      } else {
        setEditLeadFields(fields);
        setEditDynamicData(existing || {});
      }
    } catch {
      if (mode === 'new') {
        setNewLeadFields([]);
        setNewDynamicData(existing || {});
      } else {
        setEditLeadFields([]);
        setEditDynamicData(existing || {});
      }
    }
  };

  const isMissingDynamicValue = (field: LeadField, value: any) => {
    if (field.type === 'CHECKBOX') {
      return value === undefined || value === null;
    }
    return value === undefined || value === null || String(value).trim() === '';
  };

  const validateRequiredDynamic = (fields: LeadField[], values: Record<string, any>): boolean => {
    const missing = fields.filter((f) => f.required).some((f) => isMissingDynamicValue(f, values[f.key]));
    if (missing) {
      toast.error('Please fill all required dynamic fields');
      return false;
    }
    return true;
  };

  const buildDynamicPayload = (fields: LeadField[], values: Record<string, any>) => {
    if (!fields.length) return undefined;
    const out: Record<string, any> = {};
    fields.forEach((f) => {
      const v = values[f.key];
      if (f.type === 'CHECKBOX') {
        if (v === true || v === false) out[f.key] = v;
        return;
      }
      if (v === undefined || v === null || String(v).trim() === '') return;
      if (f.type === 'NUMBER') {
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(n)) return;
        out[f.key] = n;
        return;
      }
      out[f.key] = v;
    });
    return out;
  };

  const renderDynamicFields = (
    fields: LeadField[],
    values: Record<string, any>,
    setValues: (next: Record<string, any>) => void,
  ) => {
    if (!fields.length) return null;
    return (
      <>
        {fields.map((f) => {
          const value = values[f.key];
          const label = `${f.label}${f.required ? ' *' : ''}`;

          if (f.type === 'SELECT') {
            return (
              <div key={f.id} className="grid gap-2">
                <Label>{label}</Label>
                <Select value={typeof value === 'string' ? value : ''} onValueChange={(v) => setValues({ ...values, [f.key]: v })}>
                  <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {(f.options || []).map((o) => (
                      <SelectItem key={String(o)} value={String(o)}>{String(o)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (f.type === 'CHECKBOX') {
            return (
              <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                <Label className="m-0">{label}</Label>
                <Checkbox checked={value === true} onCheckedChange={(checked) => setValues({ ...values, [f.key]: Boolean(checked) })} />
              </div>
            );
          }

          if (f.type === 'DATE') {
            return (
              <div key={f.id} className="grid gap-2">
                <Label>{label}</Label>
                <Input type="date" value={typeof value === 'string' ? value : ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              </div>
            );
          }

          if (f.type === 'NUMBER') {
            return (
              <div key={f.id} className="grid gap-2">
                <Label>{label}</Label>
                <Input type="number" value={value === undefined || value === null ? '' : String(value)} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              </div>
            );
          }

          return (
            <div key={f.id} className="grid gap-2">
              <Label>{label}</Label>
              <Input value={typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value)} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            </div>
          );
        })}
      </>
    );
  };

  const projectOptions = useMemo<ProjectOption[]>(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      if (l.project?.id && l.project?.name) {
        map.set(l.project.id, l.project.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const [kpiSummary, setKpiSummary] = useState<{ total: number; new: number; qualified: number; converted: number } | null>(null);

  const loadLeads = async (args?: { page?: number; pageSize?: number }) => {
    setIsLoading(true);
    try {
      const nextPage = args?.page ?? page;
      const nextPageSize = args?.pageSize ?? pageSize;

      const [paged, summary] = await Promise.all([
        leadsService.getManagerLeads({ page: nextPage, pageSize: nextPageSize }),
        leadsService.getManagerLeadsSummary(),
      ]);

      setLeads(paged.items || []);
      setTotalCount(paged.total || 0);
      setKpiSummary(summary);

      const results = await Promise.allSettled(
        (paged.items || []).map(async (l) => {
          return leadsService.getManagerAllowedActions(l.id);
        }),
      );

      const next: Record<string, AllowedLeadActions> = {};
      (paged.items || []).forEach((l, idx) => {
        const r = results[idx];
        if (r && r.status === 'fulfilled' && r.value) {
          next[l.id] = r.value as AllowedLeadActions;
        }
      });
      setAllowedActionsById(next);
    } catch {
      setLeads([]);
      setAllowedActionsById({});
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads({ page: 1, pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentPage = (nextPage: number) => {
    setPage(nextPage);
    void loadLeads({ page: nextPage, pageSize });
  };

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchesProject = projectFilter === 'all' || String(lead.project?.id || '') === projectFilter;
      const matchesAssigned =
        assignedFilter === 'all' ||
        (assignedFilter === 'unassigned' ? !lead.assignedTo?.id : lead.assignedTo?.id === assignedFilter);

      let matchesDate = true;
      if (dateRange.from && dateRange.to) {
        const leadDate = new Date(lead.createdAt);
        matchesDate = isWithinInterval(leadDate, { start: dateRange.from, end: dateRange.to });
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSource &&
        matchesProject &&
        matchesAssigned &&
        matchesDate
      );
    });
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter, projectFilter, assignedFilter, dateRange]);

  const combinedListFields = useMemo<LeadField[]>(() => {
    if (projectFilter === 'all') return [];
    const base = (listLeadFields || []).slice();
    const existing = new Set(base.map((f) => String(f.key)));
    const inferredKeys = new Set<string>();

    filteredLeads.slice(0, 500).forEach((l) => {
      const dyn = (l as any)?.dynamicData;
      if (!dyn || typeof dyn !== 'object') return;
      Object.keys(dyn).forEach((k) => {
        if (!existing.has(k)) inferredKeys.add(k);
      });
    });

    const inferred = Array.from(inferredKeys)
      .sort((a, b) => a.localeCompare(b))
      .map((k, idx) =>
        ({
          id: `inferred_${k}`,
          key: k,
          label: k,
          type: 'TEXT',
          required: false,
          order: (base.length + idx) as any,
          createdAt: '',
          updatedAt: '',
          projectId: projectFilter,
          options: null,
        } as any as LeadField),
      );

    return base.concat(inferred);
  }, [filteredLeads, listLeadFields, projectFilter]);

  const paginatedLeads = filteredLeads;
  const currentPage = page;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLeads.map((l) => l.id)));
    }
  };

  const calendarLeads = useMemo(() => {
    return filteredLeads.slice(0, 200);
  }, [filteredLeads]);

  const kpis = useMemo(
    () => ({
      total: kpiSummary?.total ?? totalCount,
      new: kpiSummary?.new ?? 0,
      qualified: kpiSummary?.qualified ?? 0,
      converted: kpiSummary?.converted ?? 0,
    }),
    [kpiSummary, totalCount],
  );

  function getCoreKeys(fields: LeadField[]) {
    const norm = (s: string) => String(s || '').trim().toLowerCase();
    const byKey = new Map(fields.map((f) => [norm(f.key), f]));
    const nameKey = byKey.get('name')?.key || byKey.get('full_name')?.key || null;
    const emailKey = byKey.get('email')?.key || null;
    const phoneKey = byKey.get('phone')?.key || byKey.get('mobile')?.key || null;
    return { nameKey, emailKey, phoneKey };
  }

  function resolveCoreValues(
    fields: LeadField[],
    values: Record<string, any>,
    fallback: { name: string; email: string; phone: string },
  ) {
    const keys = getCoreKeys(fields);
    const pick = (k: string | null, fb: string) => {
      if (!k) return fb;
      const v = values?.[k];
      if (v === undefined || v === null) return '';
      return String(v).trim();
    };
    const name = pick(keys.nameKey, fallback.name).trim();
    const email = pick(keys.emailKey, fallback.email).trim();
    const phone = pick(keys.phoneKey, fallback.phone).trim();
    if (!name || !email || !phone) {
      toast.error('Please fill all required fields');
      return null;
    }
    return { name, email, phone };
  }

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null; preset: DatePreset }) => {
    setDateRange({ from: range.from, to: range.to });
  };

  const handleExportAll = () => {
    const headers = ["Name", "Email", "Phone", "Project", "Status", "Priority", "Value", "Source", "Assigned To"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.project?.name || "",
      lead.status,
      lead.priority || "",
      String(lead.budget ?? ""),
      lead.source,
      lead.assignedTo?.name || "",
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
      lead.project?.name || "",
      lead.status,
      lead.source,
      lead.assignedTo?.name || "",
    ]);
    downloadCsv(`leads-${status.toLowerCase()}`, headers, rows);
    toast.success(`${status} leads exported`);
  };

  const upsertLeadInState = (updated: ManagerLead) => {
    setLeads((prev) => {
      const idx = prev.findIndex((l) => l.id === updated.id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
    setSelectedLead((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleAssignLead = async (leadId: string, agentId: string) => {
    try {
      const updated = await leadsService.assignManagerLead(leadId, agentId);
      upsertLeadInState(updated);
      toast.success('Lead assigned successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign lead';
      toast.error(message || 'Failed to assign lead');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const updated = await leadsService.updateManagerLeadStatus(leadId, newStatus);
      upsertLeadInState(updated);
      toast.success('Lead status updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead status';
      toast.error(message || 'Failed to update lead status');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const idsToUpdate = Array.from(selectedIds);
      const results = await Promise.allSettled(
        idsToUpdate.map(async (id) => {
          await leadsService.updateManagerLeadStatus(id, newStatus);
          return id;
        }),
      );

      const succeededIds = results.filter((r) => r.status === 'fulfilled').map((r) => (r as any).value as string);
      const failed = results.length - succeededIds.length;

      if (succeededIds.length > 0) {
        setLeads((prev) => prev.map((l) => (succeededIds.includes(l.id) ? { ...l, status: newStatus } : l)));
        setSelectedLead((prev) => (prev && succeededIds.includes(prev.id) ? { ...prev, status: newStatus } : prev));
        toast.success(`Updated status for ${succeededIds.length} lead(s)`);
      }
      if (failed > 0) {
        const errMsg = (results.find((r) => r.status === 'rejected') as any)?.reason?.message;
        toast.error(errMsg || `Failed to update status for ${failed} lead(s)`);
      }
    } finally {
      setSelectedIds(new Set());
    }
  };

  const handleBulkAssign = async (agentId: string) => {
    try {
      const idsToAssign = Array.from(selectedIds);
      const assignedAgent = staffOptions.find((a) => a.id === agentId) || null;
      const results = await Promise.allSettled(
        idsToAssign.map(async (id) => {
          await leadsService.assignManagerLead(id, agentId);
          return id;
        }),
      );

      const succeededIds = results.filter((r) => r.status === 'fulfilled').map((r) => (r as any).value as string);
      const failed = results.length - succeededIds.length;

      if (succeededIds.length > 0) {
        setLeads((prev) => prev.map((l) => (succeededIds.includes(l.id) ? { ...l, assignedTo: assignedAgent } : l)));
        setSelectedLead((prev) => (prev && succeededIds.includes(prev.id) ? { ...prev, assignedTo: assignedAgent } : prev));
        toast.success(`Assigned ${succeededIds.length} lead(s)`);
      }
      if (failed > 0) {
        const errMsg = (results.find((r) => r.status === 'rejected') as any)?.reason?.message;
        toast.error(errMsg || `Failed to assign ${failed} lead(s)`);
      }

      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to assign leads");
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    const results = await Promise.allSettled(
      idsToDelete.map(async (id) => {
        await leadsService.deleteManagerLead(id);
        return id;
      }),
    );

    const succeededIds = results.filter((r) => r.status === 'fulfilled').map((r) => (r as any).value as string);
    const failed = results.length - succeededIds.length;

    if (succeededIds.length > 0) {
      setLeads((prev) => prev.filter((l) => !succeededIds.includes(l.id)));
      toast.success(`Deleted ${succeededIds.length} lead(s)`);
    }
    if (failed > 0) {
      const errMsg = (results.find((r) => r.status === 'rejected') as any)?.reason?.message;
      toast.error(errMsg || `Failed to delete ${failed} lead(s)`);
    }

    setSelectedIds(new Set());
  };

  const handleEdit = (lead: ManagerLead) => {
    setSelectedLead(lead);
    setEditLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      projectId: lead.project?.id || '',
      assignedToId: lead.assignedTo?.id || '',
      budget: String(lead.budget ?? ''),
      source: lead.source,
      priority: (lead.priority || 'Medium') as any,
      notes: lead.notes || '',
    });
    setEditDynamicData((lead as any)?.dynamicData || {});
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

  const handleDelete = (lead: ManagerLead) => {
    setSelectedLead(lead);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;
    try {
      const deleted = await leadsService.deleteManagerLead(selectedLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleted.id));
      setAllowedActionsById((prev) => {
        const next = { ...prev };
        delete next[deleted.id];
        return next;
      });
      setIsDeleteOpen(false);
      setSelectedLead(null);
      toast.success('Lead deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lead';
      toast.error(message || 'Failed to delete lead');
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead || !editLead.name || !editLead.email || !editLead.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (!validateRequiredDynamic(editLeadFields, editDynamicData)) return;
      const dynamicData = buildDynamicPayload(editLeadFields, editDynamicData);
      const nextAssignedToId = editLead.assignedToId || '';
      const updated = await leadsService.updateManagerLead(selectedLead.id, {
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        projectId: editLead.projectId ? editLead.projectId : undefined,
        budget: editLead.budget ? editLead.budget : undefined,
        source: editLead.source,
        priority: editLead.priority ? editLead.priority : undefined,
        notes: editLead.notes ? editLead.notes : undefined,
        assignedToId: nextAssignedToId ? nextAssignedToId : undefined,
        ...(dynamicData ? { dynamicData } : {}),
      });
      upsertLeadInState(updated);
      setIsEditOpen(false);
      setEditDynamicData({});
      toast.success('Lead updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead';
      toast.error(message || 'Failed to update lead');
    }
  };

  const canBulkAssign = useMemo(() => {
    if (selectedIds.size === 0) return false;
    return Array.from(selectedIds).every((id) => getAllowedActionsForLead(id).canAssign);
  }, [allowedActionsById, selectedIds]);

  const canBulkChangeStatus = useMemo(() => {
    if (selectedIds.size === 0) return false;
    return Array.from(selectedIds).every((id) => getAllowedActionsForLead(id).canChangeStatus);
  }, [allowedActionsById, selectedIds]);

  const canBulkDelete = useMemo(() => {
    if (selectedIds.size === 0) return false;
    return Array.from(selectedIds).every((id) => getAllowedActionsForLead(id).canDelete);
  }, [allowedActionsById, selectedIds]);

  const handleAddLead = async () => {
    try {
      if (!newLead.budget || !newLead.source) {
        toast.error('Please fill all required fields');
        return;
      }

      const hasSchema = newLeadFields.length > 0;
      if (hasSchema) {
        if (!validateRequiredDynamic(newLeadFields, newDynamicData)) return;
        const core = resolveCoreValues(newLeadFields, newDynamicData, {
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
        });
        if (!core) return;
        const dynamicData = buildDynamicPayload(newLeadFields, newDynamicData);
        await leadsService.createManagerLead({
          name: core.name,
          email: core.email,
          phone: core.phone,
          projectId: newLead.projectId ? newLead.projectId : undefined,
          budget: newLead.budget,
          source: newLead.source,
          priority: newLead.priority ? newLead.priority : undefined,
          notes: newLead.notes ? newLead.notes : undefined,
          assignedToId: newLeadStaffId ? newLeadStaffId : undefined,
          ...(dynamicData ? { dynamicData } : {}),
        });
      } else {
        if (!newLead.name || !newLead.email || !newLead.phone) {
          toast.error('Please fill all required fields');
          return;
        }
        const dynamicData = buildDynamicPayload(newLeadFields, newDynamicData);
        await leadsService.createManagerLead({
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          projectId: newLead.projectId ? newLead.projectId : undefined,
          budget: newLead.budget,
          source: newLead.source,
          priority: newLead.priority ? newLead.priority : undefined,
          notes: newLead.notes ? newLead.notes : undefined,
          assignedToId: newLeadStaffId ? newLeadStaffId : undefined,
          ...(dynamicData ? { dynamicData } : {}),
        });
      }

      await loadLeads({ page: 1, pageSize });
      setIsAddOpen(false);
      setAddLeadStep('project');
      setNewLead({ name: "", email: "", phone: "", projectId: "", budget: "", source: "Website", priority: "Medium", notes: "" });
      setNewDynamicData({});
      toast.success('Lead added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead';
      toast.error(message || 'Failed to create lead');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportCsv(event.target?.result as string);
      setIsImportOpen(true);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      if (!importCsv || importCsv.trim().length === 0) {
        toast.error('Please paste CSV content first');
        return;
      }

      const { rows } = parseCsv(importCsv);
      if (rows.length === 0) {
        toast.error('No data found in CSV');
        return;
      }

      const headerColsLower = (() => {
        const header = importCsv.split(/\r\n|\n|\r/)[0] || '';
        return header
          .split(',')
          .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
          .filter(Boolean);
      })();

      const hasProjectIdColumn = headerColsLower.includes('projectid');
      if (!hasProjectIdColumn && !importProjectId) {
        toast.error('Please select a project for this import');
        return;
      }

      if (importProjectId) {
        const hasAny = (candidates: string[]) => candidates.some((c) => headerColsLower.includes(c));
        const missingCore: string[] = [];
        if (!hasAny(['name', 'full_name', 'fullname'])) missingCore.push('name');
        if (!hasAny(['email'])) missingCore.push('email');
        if (!hasAny(['phone', 'mobile', 'mobile_no', 'mobileno'])) missingCore.push('phone');
        if (missingCore.length > 0) {
          toast.error(`CSV missing required column(s): ${missingCore.join(', ')}`);
          return;
        }
      }

      const file = new File([importCsv], 'leads.csv', { type: 'text/csv' });
      const res = await leadsService.importCsv(file, importProjectId || undefined);
      if (!res?.success) {
        toast.error(res?.message || 'Failed to import CSV');
        return;
      }
      toast.success('Leads imported successfully');
      setIsImportOpen(false);
      setImportCsv('');
      setImportProjectId('');
      await loadLeads({ page: 1, pageSize });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import CSV';
      toast.error(message);
    }
  };

  const renderListView = () => (
    <Table className="min-w-[1100px]">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-12">
            <Checkbox checked={selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0} onCheckedChange={toggleSelectAll} />
          </TableHead>

          {(projectFilter !== 'all' && combinedListFields.length > 0) ? (
            <>
              {combinedListFields.map((f) => (
                <TableHead key={f.id} className="font-semibold min-w-[160px]">{f.label}</TableHead>
              ))}
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </>
          ) : (
            <>
              <TableHead className="font-semibold"><div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div></TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Assigned</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedLeads.map((lead) => (
          <TableRow key={lead.id} className={cn("cursor-pointer hover:bg-muted/50 transition-colors", selectedIds.has(lead.id) && "bg-primary/5")} onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}>
            <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></TableCell>
            {(projectFilter !== 'all' && combinedListFields.length > 0) ? (
              <>
                {combinedListFields.map((f) => {
                  const v = (lead as any)?.dynamicData?.[f.key];
                  const display = (v === undefined || v === null || String(v).trim() === '')
                    ? '—'
                    : f.type === 'CHECKBOX'
                      ? (v === true ? 'Yes' : 'No')
                      : String(v);

                  return (
                    <TableCell key={f.id} className="max-w-[220px] truncate">
                      <span className="text-sm text-foreground whitespace-nowrap">{display}</span>
                    </TableCell>
                  );
                })}

                <TableCell><span className="text-sm">{lead.project?.name || 'N/A'}</span></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem disabled={!getAllowedActionsForLead(lead.id).canEdit} onClick={() => handleEdit(lead)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCall(lead)}><Phone className="w-4 h-4 mr-2" /> Call</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEmail(lead)}><Mail className="w-4 h-4 mr-2" /> Email</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" disabled={!getAllowedActionsForLead(lead.id).canDelete} onClick={() => handleDelete(lead)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell><div><p className="font-medium">{lead.name}</p></div></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.email}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.phone}</span></div>
                  </div>
                </TableCell>
                <TableCell><span className="text-sm">{lead.project?.name || 'N/A'}</span></TableCell>
                <TableCell><Badge variant="outline" className={cn("text-xs border", getStatusStyle(lead.status))}>{lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}</Badge></TableCell>
                <TableCell><Badge variant="secondary" className={cn("text-xs", getPriorityStyle(lead.priority || ''))}>{lead.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="text-xs font-normal">{lead.source}</Badge></TableCell>
                <TableCell><span className="text-sm">{lead.assignedTo?.name || 'Unassigned'}</span></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={!getAllowedActionsForLead(lead.id).canAssign || staffOptions.length === 0}>
                      <Users className="w-4 h-4 mr-2" /> Assign to
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover">
                      {staffOptions.map((a) => (
                        <DropdownMenuItem key={a.id} onClick={() => handleAssignLead(lead.id, a.id)}>
                          {a.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger disabled={!getAllowedActionsForLead(lead.id).canChangeStatus}>
                      <ArrowUpDown className="w-4 h-4 mr-2" /> Change status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover">
                      {(statusList.length ? statusList : statusOptions.slice(1).map((s) => s.value)).map((s) => (
                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)}>
                          {statusLabel(s)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    disabled={!getAllowedActionsForLead(lead.id).canEdit}
                    onClick={() => handleEdit(lead)}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCall(lead)}><Phone className="w-4 h-4 mr-2" /> Call</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEmail(lead)}><Mail className="w-4 h-4 mr-2" /> Email</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    disabled={!getAllowedActionsForLead(lead.id).canDelete}
                    onClick={() => handleDelete(lead)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderGridView = (variant: 'small' | 'large') => (
    <div className={cn("grid gap-4", variant === 'small' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
      {paginatedLeads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead as any}
          selected={selectedIds.has(lead.id)}
          onSelect={() => toggleSelect(lead.id)}
          onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
          onViewDetails={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
          onEdit={getAllowedActionsForLead(lead.id).canEdit ? () => handleEdit(lead) : undefined}
          onCall={() => handleCall(lead)}
          onDelete={getAllowedActionsForLead(lead.id).canDelete ? () => handleDelete(lead) : undefined}
          variant={variant}
        />
      ))}
    </div>
  );

  return (
    <PageWrapper title="Lead Management" description="Manage and assign leads to your team." sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
          <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
          <Dialog
            open={isAddOpen}
            onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) setAddLeadStep('project');
            }}
          >
            <DialogTrigger asChild><Button className="w-full sm:w-auto" size="sm"><Plus className="w-4 h-4 mr-2" />Add Lead</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle><DialogDescription>Enter lead details</DialogDescription></DialogHeader>
              {addLeadStep === 'project' ? (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Select Project First</Label>
                    <Select
                      value={newLead.projectId ? String(newLead.projectId) : 'none'}
                      onValueChange={(v) => {
                        const nextProject = v === 'none' ? '' : v;
                        setNewLead({ ...newLead, projectId: nextProject });
                        setNewDynamicData({});
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="none">No Project</SelectItem>
                        {projectOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">After selecting a project, its schema fields will appear.</div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  {newLeadFields.length === 0 ? (
                    <>
                      <div className="grid gap-2"><Label>Full Name *</Label><Input placeholder="Enter full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Email *</Label><Input type="email" placeholder="email@example.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Phone *</Label><Input placeholder="+91 98765 43210" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} /></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        <Label>Project</Label>
                        <Select
                          value={newLead.projectId ? String(newLead.projectId) : 'none'}
                          onValueChange={(v) => {
                            const nextProject = v === 'none' ? '' : v;
                            setNewLead({ ...newLead, projectId: nextProject });
                            setNewDynamicData({});
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="none">No Project</SelectItem>
                            {projectOptions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(() => {
                        const keys = getCoreKeys(newLeadFields);
                        const nameMissing = !keys.nameKey;
                        const emailMissing = !keys.emailKey;
                        const phoneMissing = !keys.phoneKey;

                        if (!nameMissing && !emailMissing && !phoneMissing) return null;

                        return (
                          <div className="grid gap-4">
                            {nameMissing && (
                              <div className="grid gap-2">
                                <Label>Full Name *</Label>
                                <Input placeholder="Enter full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
                              </div>
                            )}

                            {(emailMissing || phoneMissing) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {emailMissing && (
                                  <div className="grid gap-2">
                                    <Label>Email *</Label>
                                    <Input type="email" placeholder="email@example.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                                  </div>
                                )}
                                {phoneMissing && (
                                  <div className="grid gap-2">
                                    <Label>Phone *</Label>
                                    <Input placeholder="+91 98765 43210" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {renderDynamicFields(newLeadFields, newDynamicData, setNewDynamicData)}
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label>Assign To *</Label>
                    <Select value={newLeadStaffId} onValueChange={setNewLeadStaffId}>
                      <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                      <SelectContent className="bg-popover">
                        {staffOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Budget *</Label>
                    <Input placeholder="₹50L - ₹1Cr" value={newLead.budget} onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Source *</Label>
                      <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Walk_in">Walk-in</SelectItem>
                          <SelectItem value="Google_Ads">Google Ads</SelectItem>
                          <SelectItem value="Unit_Interest">Unit Interest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <Select value={newLead.priority} onValueChange={(v) => setNewLead({ ...newLead, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} /></div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (addLeadStep === 'details') {
                      setAddLeadStep('project');
                      return;
                    }
                    setIsAddOpen(false);
                    setAddLeadStep('project');
                  }}
                >
                  {addLeadStep === 'details' ? 'Back' : 'Cancel'}
                </Button>

                {addLeadStep === 'project' ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setAddLeadStep('details')}
                    disabled={!newLead.projectId}
                  >
                    Next
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto" onClick={handleAddLead}>Add Lead</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value={kpis.total} icon={Users} delay={0} />
        <KPICard title="New" value={kpis.new} icon={Users} change={12} changeLabel="this week" delay={0.1} />
        <KPICard title="Qualified" value={kpis.qualified} icon={Users} delay={0.2} />
        <KPICard title="Converted" value={kpis.converted} icon={Users} iconColor="text-success" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <LeadFiltersBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          projectFilter={projectFilter}
          onProjectChange={setProjectFilter}
          projects={projectOptions}
          assignedFilter={assignedFilter}
          onAssignedChange={setAssignedFilter}
          onDateRangeChange={handleDateRangeChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          agents={staffOptions}
          totalCount={totalCount}
          filteredCount={filteredLeads.length}
          selectedCount={selectedIds.size}
          onExportAll={handleExportAll}
          onExportByStatus={handleExportByStatus}
          onImport={() => fileInputRef.current?.click()}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <LeadCalendarView
            leads={calendarLeads as any}
            onLeadClick={(lead: any) => {
              setSelectedLead(lead as any);
              setIsDetailOpen(true);
            }}
          />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {viewMode === 'list' ? renderListView() : renderGridView(viewMode === 'grid-small' ? 'small' : 'large')}
            <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="border-0 p-0" />
            </div>
          </div>
        )}
      </motion.div>

      <ActionBottomBar selectedCount={selectedIds.size} onClose={() => setSelectedIds(new Set())}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={!canBulkChangeStatus}>
              <ArrowUpDown className="w-4 h-4" />Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            {(statusList.length ? statusList : statusOptions.slice(1).map((s) => s.value)).map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleBulkStatusChange(s)}>
                {statusLabel(s)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={!canBulkAssign}>
              <Users className="w-4 h-4" />Assign to
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            {staffOptions.map((a) => (
              <DropdownMenuItem key={a.id} onClick={() => handleBulkAssign(a.id)}>
                {a.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportAll}>
          <Download className="w-4 h-4" />Export
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={!canBulkDelete} onClick={handleBulkDelete}>
          <Trash2 className="w-4 h-4" />Delete
        </Button>
      </ActionBottomBar>

      <Dialog open={isImportOpen} onOpenChange={(open) => {
        setIsImportOpen(open);
        if (!open) setImportProjectId('');
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Import Leads from CSV</DialogTitle><DialogDescription>Review and import</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-2">Sample Format:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{sampleLeadsCsvTemplate}</pre>
            </div>

            <div className="grid gap-2">
              <Label>Import Into Project</Label>
              <Select value={importProjectId || 'none'} onValueChange={(v) => setImportProjectId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">(Use projectId from CSV)</SelectItem>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">If your CSV does not contain a projectId column, select a project here.</div>
            </div>

            <Textarea placeholder="CSV content..." value={importCsv} onChange={(e) => setImportCsv(e.target.value)} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleImport} disabled={!importCsv || importCsv.trim().length === 0}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadDetailModal lead={detailLead} open={isDetailOpen} onOpenChange={setIsDetailOpen} />

      {/* Edit Lead Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input placeholder="Enter full name" value={editLead.name} onChange={(e) => setEditLead({ ...editLead, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={editLead.email} onChange={(e) => setEditLead({ ...editLead, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={editLead.phone} onChange={(e) => setEditLead({ ...editLead, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project</Label>
                <Select value={editLead.projectId} onValueChange={(v) => setEditLead({ ...editLead, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {projectOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Budget</Label>
                <Input placeholder="₹50L - ₹1Cr" value={editLead.budget} onChange={(e) => setEditLead({ ...editLead, budget: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <Select value={editLead.assignedToId} onValueChange={(v) => setEditLead({ ...editLead, assignedToId: v })}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {staffOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={editLead.source} onValueChange={(v) => setEditLead({ ...editLead, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Walk_in">Walk-in</SelectItem>
                    <SelectItem value="Google_Ads">Google Ads</SelectItem>
                    <SelectItem value="Unit_Interest">Unit Interest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={editLead.priority} onValueChange={(v) => setEditLead({ ...editLead, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={editLead.notes} onChange={(e) => setEditLead({ ...editLead, notes: e.target.value })} />
            </div>

            {renderDynamicFields(editLeadFields, editDynamicData, setEditDynamicData)}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!selectedLead || !getAllowedActionsForLead(selectedLead.id).canEdit}
              onClick={handleUpdateLead}
            >
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedLead?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={confirmDelete}>Delete Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};