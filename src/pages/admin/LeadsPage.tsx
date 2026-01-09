import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Download,
  Upload,
  Search,
  Users,
  UserPlus,
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

type StaffOption = { id: string; name: string };

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "FOLLOWUP", label: "Follow Up" },
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

export const LeadsPage = () => {
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
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editLead, setEditLead] = useState({ name: "", email: "", phone: "", project: "", budget: "", source: "Website", priority: "Medium", notes: "" });
  const [importCsv, setImportCsv] = useState("");

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
      const res = await leadsService.listAdminLeads();
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
    downloadCsv("leads-export", headers, rows);
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
    if (selectedIds.size === 0) return;

    const idsToUpdate = Array.from(selectedIds);
    try {
      const results = await Promise.all(
        idsToUpdate.map(async (id) => {
          try {
            const res = await leadsService.updateLeadStatus(id, newStatus);
            return { id, res };
          } catch (e) {
            return { id, error: e };
          }
        }),
      );

      const succeeded = results.filter((r) => (r as any).res?.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        setLeads((prev) =>
          prev.map((l) => (idsToUpdate.includes(l.id) ? { ...l, status: newStatus } : l)),
        );
        toast.success(`Updated status for ${succeeded} lead(s)`);
      }
      if (failed > 0) {
        toast.error(`Failed to update status for ${failed} lead(s)`);
      }
    } finally {
      setSelectedIds(new Set());
    }
  };

  const handleBulkAssign = async (agentId: string) => {
    try {
      const idsToAssign = Array.from(selectedIds);
      const results = await Promise.all(
        idsToAssign.map(async (id) => {
          try {
            const res = await leadsService.assignLead(id, agentId);
            return { id, res };
          } catch (e) {
            return { id, error: e };
          }
        }),
      );

      const succeededIds = results.filter((r) => (r as any).res?.success).map((r) => (r as any).id as string);
      const failed = results.length - succeededIds.length;

      if (succeededIds.length > 0) {
        setLeads((prev) => prev.filter((l) => !succeededIds.includes(l.id)));
        toast.success(`Assigned ${succeededIds.length} lead(s)`);
      }
      if (failed > 0) {
        toast.error(`Failed to assign ${failed} lead(s)`);
      }

      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to assign leads");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      const results = await Promise.all(
        idsToDelete.map(async (id) => {
          try {
            const res = await leadsService.deleteLead(id);
            return { id, res };
          } catch (e) {
            return { id, error: e };
          }
        }),
      );

      const succeededIds = results.filter((r) => (r as any).res?.success).map((r) => (r as any).id as string);
      const failed = results.length - succeededIds.length;

      if (succeededIds.length > 0) {
        setLeads((prev) => prev.filter((l) => !succeededIds.includes(l.id)));
        toast.success(`Deleted ${succeededIds.length} lead(s)`);
      }
      if (failed > 0) {
        toast.error(`Failed to delete ${failed} lead(s)`);
      }
    } finally {
      setSelectedIds(new Set());
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await leadsService.createLead({
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        projectId: newLead.project ? newLead.project : null,
        budget: newLead.budget ? Number(newLead.budget) : null,
        source: (newLead.source || 'Website') as any,
        priority: (newLead.priority || undefined) as any,
        notes: newLead.notes ? newLead.notes : null,
        tenantId: 'tenant_default',
      });
      await loadLeads();
      setIsAddOpen(false);
      setNewLead({ name: "", email: "", phone: "", project: "", budget: "", source: "Website", priority: "Medium", notes: "" });
      toast.success("Lead added successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead';
      toast.error(message || "Failed to create lead");
    }
  };

  const handleQuickAdd = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await leadsService.createLead({
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        projectId: newLead.project ? newLead.project : null,
        budget: newLead.budget ? Number(newLead.budget) : null,
        source: (newLead.source || 'Website') as any,
        priority: (newLead.priority || undefined) as any,
        notes: newLead.notes ? newLead.notes : null,
        tenantId: 'tenant_default',
      });
      await loadLeads();
      setIsQuickAddOpen(false);
      setNewLead({ name: "", email: "", phone: "", project: "", budget: "", source: "Website", priority: "Medium", notes: "" });
      toast.success("Lead added quickly!");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lead';
      toast.error(message || "Failed to create lead");
    }
  };

  const handleImport = () => {
    try {
      const { headers, rows } = parseCsv(importCsv);
      if (rows.length === 0) {
        toast.error("No data found in CSV");
        return;
      }
      toast.success(`Parsed ${rows.length} leads from CSV`);
      setIsImportOpen(false);
      setImportCsv("");
    } catch (error) {
      toast.error("Failed to parse CSV");
    }
  };

  const handleEdit = (lead: LeadDb & { assignedTo?: string | null }) => {
    setSelectedLead(lead);
    setEditLead({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      project: lead.projectId || "",
      budget: lead.budget != null ? String(lead.budget) : "",
      source: lead.source,
      priority: lead.priority || "Medium",
      notes: lead.notes || ""
    });
    setIsEditOpen(true);
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
      await loadLeads();
      setIsEditOpen(false);
      toast.success('Lead updated successfully');
    } catch {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = (lead: LeadDb & { assignedTo?: string | null }) => {
    setSelectedLead(lead);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;

    try {
      const res = await leadsService.deleteLead(selectedLead.id);
      if (!res.success) {
        toast.error(res.message || 'Failed to delete lead');
        return;
      }
      setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
      setIsDeleteOpen(false);
      toast.success('Lead deleted successfully');
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const handleCall = (lead: LeadDb & { assignedTo?: string | null }) => {
    toast.info(`Calling ${lead.phone}...`);
    window.open(`tel:${lead.phone}`, '_blank');
  };

  const handleEmail = (lead: LeadDb & { assignedTo?: string | null }) => {
    toast.info(`Opening email client for ${lead.email}...`);
    window.open(`mailto:${lead.email}`, '_blank');
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null; preset: DatePreset }) => {
    setDateRange({ from: range.from, to: range.to });
  };

  const renderListView = () => (
    <Table className="min-w-[1000px]">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-12">
            <Checkbox 
              checked={selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0}
              onCheckedChange={toggleSelectAll}
            />
          </TableHead>
          <TableHead className="font-semibold">
            <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div>
          </TableHead>
          <TableHead className="font-semibold">Contact</TableHead>
          <TableHead className="font-semibold">Project</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Priority</TableHead>
          <TableHead className="font-semibold">
            <div className="flex items-center gap-1">Budget <ArrowUpDown className="w-3 h-3" /></div>
          </TableHead>
          <TableHead className="font-semibold">Source</TableHead>
          <TableHead className="text-right font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedLeads.map((lead) => (
          <TableRow 
            key={lead.id} 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors",
              selectedIds.has(lead.id) && "bg-primary/5"
            )}
            onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} />
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">{lead.name}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{lead.phone}</span>
                </div>
              </div>
            </TableCell>
            <TableCell><span className="text-sm">{lead.projectId || 'N/A'}</span></TableCell>
            <TableCell>
              <Badge variant="outline" className={cn("text-xs border", getStatusStyle(lead.status))}>
                {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className={cn("text-xs", getPriorityStyle(lead.priority || ''))}>
                {lead.priority}
              </Badge>
            </TableCell>
            <TableCell><span className="font-medium">{lead.budget || 'N/A'}</span></TableCell>
            <TableCell><Badge variant="outline" className="text-xs font-normal">{lead.source}</Badge></TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}>
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(lead)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCall(lead)}>
                    <Phone className="w-4 h-4 mr-2" /> Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEmail(lead)}>
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(lead)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderGridView = (variant: 'small' | 'large') => (
    <div className={cn(
      "grid gap-4",
      variant === 'small' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
    )}>
      {paginatedLeads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          selected={selectedIds.has(lead.id)}
          onSelect={() => toggleSelect(lead.id)}
          onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
          onViewDetails={() => { setSelectedLead(lead); setIsDetailOpen(true); }}
          onEdit={() => handleEdit(lead)}
          onCall={() => handleCall(lead)}
          onDelete={() => handleDelete(lead)}
          variant={variant}
        />
      ))}
    </div>
  );

  return (
    <PageWrapper
      title="Leads Management"
      description="Manage and track all your sales leads"
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex items-center gap-2">
          <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Zap className="w-4 h-4 mr-2" />Quick Add</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Add Lead</DialogTitle>
                <DialogDescription>Add a lead with minimal information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input placeholder="Full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone *</Label>
                  <Input placeholder="+91 98765 43210" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@example.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>Cancel</Button>
                <Button onClick={handleQuickAdd}>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add New Lead</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Enter the complete lead details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="Enter full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="email@example.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone *</Label>
                    <Input placeholder="+91 98765 43210" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Project</Label>
                    <Input
                      placeholder="Project ID (optional)"
                      value={newLead.project}
                      onChange={(e) => setNewLead({ ...newLead, project: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Budget</Label>
                    <Input placeholder="₹50L - ₹1Cr" value={newLead.budget} onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Source</Label>
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
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes..." value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAddLead}>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Filters Section */}
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
          assignedFilter={assignedFilter}
          onAssignedChange={setAssignedFilter}
          onDateRangeChange={handleDateRangeChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          agents={staffOptions}
          totalCount={leads.length}
          filteredCount={filteredLeads.length}
          selectedCount={selectedIds.size}
          onExportAll={handleExportAll}
          onExportByStatus={handleExportByStatus}
          onImport={() => setIsImportOpen(true)}
        />
      </motion.div>

      {/* Content Area */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <LeadCalendarView leads={filteredLeads} onLeadClick={(lead) => { setSelectedLead(lead); setIsDetailOpen(true); }} />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {viewMode === 'list' ? renderListView() : renderGridView(viewMode === 'grid-small' ? 'small' : 'large')}
            
            {/* Pagination */}
            <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </motion.div>

      {/* Bottom Action Bar */}
      <ActionBottomBar selectedCount={selectedIds.size} onClose={() => setSelectedIds(new Set())}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><ArrowUpDown className="w-4 h-4" />Status</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            {statusOptions.slice(1).map((s) => (<DropdownMenuItem key={s.value} onClick={() => handleBulkStatusChange(s.value)}>{s.label}</DropdownMenuItem>))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><Users className="w-4 h-4" />Assign to</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            {staffOptions.map((a) => (<DropdownMenuItem key={a.id} onClick={() => handleBulkAssign(a.id)}>{a.name}</DropdownMenuItem>))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportAll}><Download className="w-4 h-4" />Export</Button>
        <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" />Delete</Button>
      </ActionBottomBar>

      {/* Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Leads from CSV</DialogTitle>
            <DialogDescription>Paste your CSV content below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-2">Sample Format:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{sampleLeadsCsvTemplate}</pre>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => {
                const blob = new Blob([sampleLeadsCsvTemplate], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'leads-template.csv';
                a.click();
              }}>Download Sample CSV</Button>
            </div>
            <Textarea placeholder="Paste CSV content here..." value={importCsv} onChange={(e) => setImportCsv(e.target.value)} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <LeadDetailModal lead={selectedLead} open={isDetailOpen} onOpenChange={setIsDetailOpen} />

      {/* Edit Lead Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name *</Label>
              <Input placeholder="Enter full name" value={editLead.name} onChange={(e) => setEditLead({ ...editLead, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="email@example.com" value={editLead.email} onChange={(e) => setEditLead({ ...editLead, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone *</Label>
                <Input placeholder="+91 98765 43210" value={editLead.phone} onChange={(e) => setEditLead({ ...editLead, phone: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project</Label>
                <Input
                  placeholder="Project ID (optional)"
                  value={editLead.project}
                  onChange={(e) => setEditLead({ ...editLead, project: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Budget</Label>
                <Input placeholder="₹50L - ₹1Cr" value={editLead.budget} onChange={(e) => setEditLead({ ...editLead, budget: e.target.value })} />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLead}>Update Lead</Button>
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
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
