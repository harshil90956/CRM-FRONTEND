import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Search, MessageSquare, Phone, Mail, MoreHorizontal, Eye, Edit, CalendarClock } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLeadStatusStyle } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { leadsService, projectsService, remindersService } from "@/api";
import type { LeadActivityDb, LeadDb, LeadField } from "@/api/services/leads.service";
import type { ProjectDb } from "@/api/services/projects.service";
import { useAppStore } from "@/stores/appStore";
import { LeadDetailModal } from "@/components/lead/LeadDetailModal";

export const AgentLeadsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadDb | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("call");
  const [activityStatus, setActivityStatus] = useState("");

  const [leadActivities, setLeadActivities] = useState<LeadActivityDb[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  const [leadsData, setLeadsData] = useState<LeadDb[]>([]);
  const [projects, setProjects] = useState<ProjectDb[]>([]);
  const [editLead, setEditLead] = useState({
    name: "",
    email: "",
    phone: "",
    projectId: "",
    budget: "",
    source: "Website",
    priority: "Medium",
    notes: "",
  });

  const [editLeadFields, setEditLeadFields] = useState<LeadField[]>([]);
  const [editDynamicData, setEditDynamicData] = useState<Record<string, any>>({});

  const loadLeadFields = async (projectId: string | null, existing?: Record<string, any> | null) => {
    try {
      const res = await leadsService.listLeadFields(projectId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load lead fields');
      }
      const fields = (res.data || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setEditLeadFields(fields);
      setEditDynamicData(existing || {});
    } catch {
      setEditLeadFields([]);
      setEditDynamicData(existing || {});
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
                  <SelectContent>
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
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                />
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

  const loadLeads = async () => {
    try {
      const res = await leadsService.listAgentLeads();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load leads');
      }
      setLeadsData(res.data || []);
    } catch {
      toast.error('Failed to load leads');
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await projectsService.list();
        if (!res.success) {
          throw new Error(res.message || 'Failed to load projects');
        }
        setProjects(res.data || []);
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  const projectNameById = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [projects]);

  const sourceOptions = useMemo(() => {
    const s = new Set<string>();
    leadsData.forEach((l) => {
      const v = String(l.source || '').trim();
      if (v) s.add(v);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [leadsData]);

  const priorityOptions = useMemo(() => {
    const s = new Set<string>();
    leadsData.forEach((l) => {
      const v = String(l.priority || '').trim();
      if (v) s.add(v);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [leadsData]);

  const myLeads = leadsData;
  const filteredLeads = myLeads.filter(l => {
    const q = search.toLowerCase();
    const projectName = l.projectId ? (projectNameById[l.projectId] || '') : (l.project?.name || '');
    const matchesSearch =
      l.name.toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || String(l.priority || '') === priorityFilter;
    const matchesSource = sourceFilter === 'all' || String(l.source || '') === sourceFilter;
    const leadProjectId = String(l.project?.id || l.projectId || '');
    const matchesProject = projectFilter === 'all' || leadProjectId === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesProject;
  });

  const { page, setPage, totalPages, pageItems: paginatedLeads } = useClientPagination(filteredLeads, { pageSize: 20 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, sourceFilter, projectFilter, setPage]);

  const leadDetailValue = useMemo(() => {
    if (!selectedLead) return null;
    const { assignedTo, ...rest } = selectedLead as any;
    return {
      ...rest,
      assignedTo: selectedLead.assignedTo?.name ?? null,
    };
  }, [selectedLead]);

  const handleSaveActivity = async () => {
    if (!selectedLead) return;

    const typeMap: Record<string, 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE'> = {
      call: 'CALL',
      meeting: 'MEETING',
      email: 'EMAIL',
      note: 'NOTE',
    };

    try {
      const res = await leadsService.logAgentLeadActivity(selectedLead.id, {
        activityType: typeMap[activityType] || 'NOTE',
        notes: activityNote,
        status: activityStatus || undefined,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to save activity');
      }

      toast.success('Activity saved successfully');
      setIsActivityOpen(false);
      setActivityNote("");
      setActivityType("call");
      setActivityStatus("");

      setLeadActivities([]);

      await loadLeads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save activity';
      toast.error(message);
    }
  };

  const loadActivities = async (leadId: string) => {
    setIsActivitiesLoading(true);
    try {
      const res = await leadsService.listAgentLeadActivities(leadId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load activities');
      }
      setLeadActivities(res.data || []);
    } catch {
      setLeadActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  const handleOpenActivity = (lead: LeadDb) => {
    setSelectedLead(lead);
    setActivityNote("");
    setActivityType("call");
    setActivityStatus(lead.status || "");
    setIsActivityOpen(true);
    void loadActivities(lead.id);
  };

  const handleOpenEdit = (lead: LeadDb) => {
    setSelectedLead(lead);
    setEditLead({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      projectId: lead.projectId || "",
      budget: String(lead.budget ?? ""),
      source: lead.source || "Website",
      priority: (lead.priority || "Medium") as any,
      notes: lead.notes || "",
    });
    const existing = (lead as any)?.dynamicData || {};
    setEditDynamicData(existing);
    void loadLeadFields(lead.projectId || null, existing);
    setIsEditOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    try {
      if (!validateRequiredDynamic(editLeadFields, editDynamicData)) return;
      const dynamicData = buildDynamicPayload(editLeadFields, editDynamicData);
      const res = await leadsService.updateAgentLead(selectedLead.id, {
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        projectId: editLead.projectId || undefined,
        budget: editLead.budget,
        source: editLead.source,
        priority: editLead.priority,
        notes: editLead.notes,
        ...(dynamicData ? { dynamicData } : {}),
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to update lead');
      }

      setIsEditOpen(false);
      setEditDynamicData({});
      await loadLeads();
      toast.success('Lead updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead';
      toast.error(message);
    }
  };

  const handleCall = (lead: LeadDb) => {
    toast.info(`Calling ${lead.phone}...`);
    window.open(`tel:${lead.phone}`, '_blank');
  };

  const handleEmail = (lead: LeadDb) => {
    toast.info(`Opening email client for ${lead.email}...`);
    window.open(`mailto:${lead.email}`, '_blank');
  };

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState<LeadDb | null>(null);
  const [reminderAt, setReminderAt] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [isReminderSaving, setIsReminderSaving] = useState(false);

  const handleOpenReminder = (lead: LeadDb) => {
    setReminderLead(lead);
    setReminderAt('');
    setReminderNote('');
    setIsReminderOpen(true);
  };

  const handleSaveReminder = async () => {
    if (!reminderLead) return;
    if (!reminderAt) {
      toast.error('Please select reminder date and time');
      return;
    }

    const dt = new Date(reminderAt);
    if (Number.isNaN(dt.getTime())) {
      toast.error('Invalid reminder time');
      return;
    }
    if (dt.getTime() <= Date.now()) {
      toast.error('Reminder time must be in the future');
      return;
    }

    setIsReminderSaving(true);
    try {
      const res = await remindersService.createReminder({
        targetType: 'LEAD',
        targetId: reminderLead.id,
        remindAt: dt.toISOString(),
        ...(reminderNote.trim() ? { note: reminderNote.trim() } : {}),
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to create reminder');
      }

      try {
        window.dispatchEvent(
          new CustomEvent('crm:reminder-scheduled', {
            detail: {
              id: (res as any)?.data?.id || `${reminderLead.id}:${dt.toISOString()}`,
              remindAt: dt.toISOString(),
              title: 'Follow-up Reminder',
              message: 'You have a follow-up pending for a lead.',
              note: reminderNote.trim() ? reminderNote.trim() : undefined,
              targetName: reminderLead.name,
              targetId: reminderLead.id,
            },
          }),
        );
      } catch {
      }

      toast.success('Reminder scheduled successfully');
      setIsReminderOpen(false);
      setReminderLead(null);
      setReminderAt('');
      setReminderNote('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create reminder';
      toast.error(message);
    } finally {
      setIsReminderSaving(false);
    }
  };

  return (
    <PageWrapper title="My Leads" description="Manage your assigned leads." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value={myLeads.length} icon={Users} delay={0} />
        <KPICard title="New" value={myLeads.filter(l => l.status === 'NEW').length} icon={Users} iconColor="text-info" delay={0.1} />
        <KPICard title="In Progress" value={myLeads.filter(l => ['CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'FOLLOWUP'].includes(l.status)).length} icon={Users} iconColor="text-warning" delay={0.2} />
        <KPICard title="Converted" value={myLeads.filter(l => l.status === 'CONVERTED').length} icon={Users} iconColor="text-success" delay={0.3} />
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search leads by name, email, or project..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sourceOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedLead(lead);
                  setIsDetailOpen(true);
                }}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{lead.name}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.email}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{lead.phone}</span></div>
                  </div>
                </TableCell>
                <TableCell><span className="text-sm">{lead.projectId ? (projectNameById[lead.projectId] || 'N/A') : (lead.project?.name || 'N/A')}</span></TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", getLeadStatusStyle(lead.status))}>
                    {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{lead.priority || '—'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">{lead.source}</Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => { setSelectedLead(lead); setIsDetailOpen(true); }}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenActivity(lead)}>
                        <MessageSquare className="w-4 h-4 mr-2" /> Log Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenReminder(lead)}>
                        <CalendarClock className="w-4 h-4 mr-2" /> Set Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit(lead)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCall(lead)}>
                        <Phone className="w-4 h-4 mr-2" /> Call
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEmail(lead)}>
                        <Mail className="w-4 h-4 mr-2" /> Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      {filteredLeads.length === 0 && <div className="text-center py-12 text-muted-foreground">You have no assigned leads.</div>}

      <LeadDetailModal
        lead={leadDetailValue}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedLead(null);
        }}
      />

      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity - {selectedLead?.name}</DialogTitle>
            <DialogDescription>Record a call, meeting, or note for this lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Update Status</Label>
              <Select value={activityStatus} onValueChange={setActivityStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Add details about the interaction..." value={activityNote} onChange={(e) => setActivityNote(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Activity Timeline</Label>
              <div className="rounded-md border p-3 max-h-48 overflow-auto">
                {isActivitiesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : leadActivities.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No activity yet.</div>
                ) : (
                  <div className="space-y-2">
                    {leadActivities.map((a) => (
                      <div key={a.id} className="text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{a.creator?.name || 'Activity'}</span>
                          <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-muted-foreground whitespace-pre-wrap break-words">{a.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await handleSaveActivity();
                if (selectedLead?.id) {
                  await loadActivities(selectedLead.id);
                }
              }}
            >
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Select value={editLead.projectId || undefined} onValueChange={(v) => setEditLead({ ...editLead, projectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectContent>
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
                  <SelectContent>
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
            <Button className="w-full sm:w-auto" onClick={handleUpdateLead}>
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              Schedule a reminder for {reminderLead?.name || 'this lead'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Add a note for yourself..."
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderOpen(false)} disabled={isReminderSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminder} disabled={isReminderSaving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};