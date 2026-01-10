import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Search, MessageSquare, Phone } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLeadStatusStyle } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { leadsService, projectsService } from "@/api";
import type { LeadDb } from "@/api/services/leads.service";
import type { ProjectDb } from "@/api/services/projects.service";
import { useAppStore } from "@/stores/appStore";

export const AgentLeadsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadDb | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("call");
  const [activityStatus, setActivityStatus] = useState("");
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

  // State management for leads - this is the single source of truth
  const [leadsData, setLeadsData] = useState<LeadDb[]>([]);

  const loadLeads = async () => {
    try {
      const res = await leadsService.list();
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

  const myLeads = currentUser?.id ? leadsData.filter((l) => l.assignedToId === currentUser.id) : [];
  const filteredLeads = myLeads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, pageItems: paginatedLeads } = useClientPagination(filteredLeads, { pageSize: 9 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

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

      await loadLeads();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save activity';
      toast.error(message);
    }
  };

  const handleOpenActivity = (lead: LeadDb) => {
    setSelectedLead(lead);
    setActivityNote("");
    setActivityType("call");
    setActivityStatus(lead.status || "");
    setIsActivityOpen(true);
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
    setIsEditOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    try {
      const res = await leadsService.updateAgentLead(selectedLead.id, {
        name: editLead.name,
        email: editLead.email,
        phone: editLead.phone,
        projectId: editLead.projectId || undefined,
        budget: editLead.budget,
        source: editLead.source,
        priority: editLead.priority,
        notes: editLead.notes,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to update lead');
      }

      setIsEditOpen(false);
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

  return (
    <PageWrapper title="My Leads" description="Manage your assigned leads." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Leads" value={myLeads.length} icon={Users} delay={0} />
        <KPICard title="New" value={myLeads.filter(l => l.status === 'NEW').length} icon={Users} iconColor="text-info" delay={0.1} />
        <KPICard title="In Progress" value={myLeads.filter(l => ['CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'FOLLOWUP'].includes(l.status)).length} icon={Users} iconColor="text-warning" delay={0.2} />
        <KPICard title="Converted" value={myLeads.filter(l => l.status === 'CONVERTED').length} icon={Users} iconColor="text-success" delay={0.3} />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedLeads.map((lead) => (
          <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getLeadStatusStyle(lead.status))}>{lead.status}</span>
              <Badge variant="outline">{lead.source}</Badge>
            </div>
            <h4 className="font-semibold">{lead.name}</h4>
            <p className="text-sm text-muted-foreground mb-2">{lead.email}</p>
            <p className="text-sm text-muted-foreground mb-3">{lead.phone}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>{lead.projectId ? (projectNameById[lead.projectId] || 'N/A') : 'N/A'}</span>
              <span>•</span>
              <span>{lead.budget}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(lead)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenActivity(lead)}>
                <MessageSquare className="w-4 h-4 mr-1" />Log Activity
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleCall(lead)}>
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      {filteredLeads.length === 0 && <div className="text-center py-12 text-muted-foreground">You have no assigned leads.</div>}

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveActivity}>Save Activity</Button>
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
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleUpdateLead}>
              Update Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};