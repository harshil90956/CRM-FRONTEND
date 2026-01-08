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
  const [assignedFilter, setAssignedFilter] = useState("all");
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
      const matchesAssigned = assignedFilter === "all" || lead.assignedToId === assignedFilter;

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
    toast.error("Edit is not implemented on backend yet");
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!newLeadStaffId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      const res = await leadsService.create({
        name: newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        status: 'NEW',
        source: (newLead.source || 'Website') as any,
        priority: (newLead.priority || undefined) as any,
        budget: newLead.budget || '',
        notes: newLead.notes || undefined,
        assignedToId: newLeadStaffId,
        tenantId: 'tenant_default',
      });
      if (!res.success) {
        toast.error(res.message || "Failed to create lead");
        return;
      }
      await loadLeads();
      setIsAddOpen(false);
      setNewLead({ name: "", email: "", phone: "", project: "", budget: "", source: "Website", priority: "Medium", notes: "" });
      toast.success("Lead added successfully");
    } catch {
      toast.error("Failed to create lead");
    }
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null; preset: DatePreset }) => {
    setDateRange({ from: range.from, to: range.to });
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

  const handleImport = () => {
    try {
      const { rows } = parseCsv(importCsv);
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

  // KPI calculations
  const kpis = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length,
  }), [leads]);

  const renderListView = () => (
    <Table className="min-w-[1100px]">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-12">
            <Checkbox checked={selectedIds.size === paginatedLeads.length && paginatedLeads.length > 0} onCheckedChange={toggleSelectAll} />
          </TableHead>
          <TableHead className="font-semibold"><div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div></TableHead>
          <TableHead className="font-semibold">Contact</TableHead>
          <TableHead className="font-semibold">Project</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Priority</TableHead>
          <TableHead className="font-semibold">Source</TableHead>
          <TableHead className="font-semibold">Assigned</TableHead>
          <TableHead className="text-right font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedLeads.map((lead) => (
          <TableRow key={lead.id} className={cn("cursor-pointer hover:bg-muted/50 transition-colors", selectedIds.has(lead.id) && "bg-primary/5")} onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}>
            <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></TableCell>
            <TableCell><div><p className="font-medium">{lead.name}</p></div></TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.email}</span></div>
                <div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.phone}</span></div>
              </div>
            </TableCell>
            <TableCell><span className="text-sm">{lead.projectId || 'N/A'}</span></TableCell>
            <TableCell><Badge variant="outline" className={cn("text-xs border", getStatusStyle(lead.status))}>{lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}</Badge></TableCell>
            <TableCell><Badge variant="secondary" className={cn("text-xs", getPriorityStyle(lead.priority || ''))}>{lead.priority}</Badge></TableCell>
            <TableCell><Badge variant="outline" className="text-xs font-normal">{lead.source}</Badge></TableCell>
            <TableCell><span className="text-sm">{lead.assignedTo || 'Unassigned'}</span></TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(lead)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCall(lead)}><Phone className="w-4 h-4 mr-2" /> Call</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEmail(lead)}><Mail className="w-4 h-4 mr-2" /> Email</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(lead)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderGridView = (variant: 'small' | 'large') => (
    <div className={cn("grid gap-4", variant === 'small' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
      {paginatedLeads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} selected={selectedIds.has(lead.id)} onSelect={() => toggleSelect(lead.id)} onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }} variant={variant} />
      ))}
    </div>
  );

  return (
    <PageWrapper title="Lead Management" description="Manage and assign leads to your team." sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
          <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="w-full sm:w-auto" size="sm"><Plus className="w-4 h-4 mr-2" />Add Lead</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle><DialogDescription>Enter lead details</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Full Name *</Label><Input placeholder="Enter full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Email *</Label><Input type="email" placeholder="email@example.com" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} /></div>
                  <div className="grid gap-2"><Label>Phone *</Label><Input placeholder="+91 98765 43210" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} /></div>
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Project</Label>
                    <Input
                      placeholder="Project ID (optional)"
                      value={newLead.project}
                      onChange={(e) => setNewLead({ ...newLead, project: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={newLead.priority} onValueChange={(v) => setNewLead({ ...newLead, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover"><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button className="w-full sm:w-auto" onClick={handleAddLead}>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value={kpis.total} icon={Users} delay={0} />
        <KPICard title="New" value={kpis.new} icon={Users} change={12} changeLabel="this week" delay={0.1} />
        <KPICard title="Qualified" value={kpis.qualified} icon={Users} delay={0.2} />
        <KPICard title="Converted" value={kpis.converted} icon={Users} iconColor="text-success" delay={0.3} />
      </div>

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
          onImport={() => fileInputRef.current?.click()}
        />
      </motion.div>

      {/* Content Area */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {isLoading ? (
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            {[...Array(5)].map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-4" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-6 w-20" /></div>))}
          </div>
        ) : viewMode === 'calendar' ? (
          <LeadCalendarView leads={filteredLeads} onLeadClick={(lead) => { setSelectedLead(lead); setIsDetailOpen(true); }} />
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {viewMode === 'list' ? renderListView() : renderGridView(viewMode === 'grid-small' ? 'small' : 'large')}
            <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </motion.div>

      {/* Bottom Action Bar */}
      <ActionBottomBar selectedCount={selectedIds.size} onClose={() => setSelectedIds(new Set())}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-2"><ArrowUpDown className="w-4 h-4" />Status</Button></DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">{statusOptions.slice(1).map((s) => (<DropdownMenuItem key={s.value} onClick={() => handleBulkStatusChange(s.value)}>{s.label}</DropdownMenuItem>))}</DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Users className="w-4 h-4" />Assign to</Button></DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">{staffOptions.map((a) => (<DropdownMenuItem key={a.id} onClick={() => handleBulkAssign(a.id)}>{a.name}</DropdownMenuItem>))}</DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportAll}><Download className="w-4 h-4" />Export</Button>
        <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleBulkDelete}><Trash2 className="w-4 h-4" />Delete</Button>
      </ActionBottomBar>

      {/* Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Import Leads from CSV</DialogTitle><DialogDescription>Review and import</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-2">Sample Format:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{sampleLeadsCsvTemplate}</pre>
            </div>
            <Textarea placeholder="CSV content..." value={importCsv} onChange={(e) => setImportCsv(e.target.value)} rows={6} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleImport}>Import</Button>
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
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
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
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleUpdateLead}>Update Lead</Button>
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
