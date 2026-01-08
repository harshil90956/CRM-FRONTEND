import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Search, Filter, MessageSquare, Phone, FileText } from "lucide-react";
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
import { leads, Activity } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getLeadStatusStyle } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const AgentLeadsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("call");
  const [activityStatus, setActivityStatus] = useState("");
  
  // State management for leads - this is the single source of truth
  const [leadsData, setLeadsData] = useState([...leads]);

  const myLeads = leadsData.filter(l => l.assignedTo === "Priya Singh" || l.assignedTo === "Rahul Verma");
  const filteredLeads = myLeads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, pageItems: paginatedLeads } = useClientPagination(filteredLeads, { pageSize: 9 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const handleAddActivity = () => {
    // Validate required fields
    if (!activityNote.trim()) {
      toast.error("Please add activity notes");
      return;
    }
    
    if (!selectedLead) {
      toast.error("No lead selected");
      return;
    }
    
    // Create new activity
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      type: activityType as 'call' | 'meeting' | 'note' | 'email',
      notes: activityNote,
      createdAt: new Date().toISOString(),
      createdBy: "Agent"
    };
    
    // Update the lead in state
    setLeadsData(prevLeads => 
      prevLeads.map(lead => {
        if (lead.id === selectedLead.id) {
          return {
            ...lead,
            activities: [...(lead.activities || []), newActivity],
            status: (activityStatus || lead.status) as any,
            updatedAt: new Date().toISOString()
          };
        }
        return lead;
      })
    );
    
    // Update selectedLead to reflect changes
    setSelectedLead(prev => prev ? {
      ...prev,
      activities: [...(prev.activities || []), newActivity],
      status: (activityStatus || prev.status) as any,
      updatedAt: new Date().toISOString()
    } : null);
    
    toast.success("Activity logged successfully");
    setIsActivityOpen(false);
    setActivityNote("");
    setActivityType("call");
    setActivityStatus("");
  };

  const handleCall = (lead: any) => {
    console.log('Call button clicked for:', lead);
    console.log('Phone number:', lead.phone);
    
    // Simple alert to test if button click works
    alert(`Calling ${lead.phone}...`);
    
    try {
      toast.info(`Calling ${lead.phone}...`);
      console.log('Opening phone dialer...');
      window.open(`tel:${lead.phone}`, '_blank');
      console.log('Phone dialer opened successfully');
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      toast.error('Failed to open phone dialer');
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
              <span>{lead.project}</span>
              <span>•</span>
              <span>{lead.budget}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { 
              setSelectedLead(lead); 
              setActivityStatus(lead.status);
              setIsActivityOpen(true); 
            }}>
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

      {selectedLead && selectedLead.activities && selectedLead.activities.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Activity Timeline - {selectedLead.name}</h3>
          <div className="space-y-4">
            {selectedLead.activities.slice().reverse().map((activity: Activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === 'call' && <Phone className="w-5 h-5 text-primary" />}
                  {activity.type === 'meeting' && <FileText className="w-5 h-5 text-primary" />}
                  {activity.type === 'note' && <MessageSquare className="w-5 h-5 text-primary" />}
                  {activity.type === 'email' && <FileText className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium capitalize">{activity.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
            <Button onClick={handleAddActivity}>Save Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};