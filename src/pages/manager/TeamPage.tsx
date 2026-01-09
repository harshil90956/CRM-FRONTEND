import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Search, Plus, MoreHorizontal, TrendingUp } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { managerTeamService } from "@/api/services/manager-team.service";
import { projectsService } from "@/api/services/projects.service";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

interface ProjectOption {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  status: "Active" | "Inactive";
  totalLeads: number;
  conversions: number;
  revenue: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  project?: string;
  tenantId?: string;
  createdAt?: string;
  managerId?: string;
}

export const ManagerTeamPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);
  const [isAssignLeadsOpen, setIsAssignLeadsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", role: "Agent", projectId: "" });
  const [editAgent, setEditAgent] = useState({ name: "", email: "", phone: "", role: "Agent", projectId: "" });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await projectsService.list();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load projects');
      }

      const data = res.data || [];
      const options = data
        .filter((p) => !p.isClosed && String(p.status).toLowerCase() === 'active')
        .map((p) => ({ id: p.id, name: p.name }));

      setProjectOptions(options);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await managerTeamService.list();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load team');
      }

      const data = res.data || [];
      const mapped: Agent[] = data.map((u) => ({
        id: u.id,
        status: u.isActive ? 'Active' : 'Inactive',
        totalLeads: 0,
        conversions: 0,
        revenue: '₹0',
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role === 'AGENT' ? 'Agent' : u.role,
        project: u.project?.name || undefined,
        tenantId: u.tenantId,
        createdAt: u.createdAt,
        managerId: u.managerId || undefined,
      }));

      setAgentsList(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTeam();
  }, []);

  const filteredAgents = agentsList.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const { page, setPage, totalPages, pageItems: paginatedAgents } = useClientPagination(filteredAgents, { pageSize: 9 });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const res = await managerTeamService.createAgent({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        projectId: newUser.projectId || undefined,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to create agent');
      }

      toast.success(`${newUser.name} added as ${newUser.role}`);
      setIsAddOpen(false);
      setNewUser({ name: "", email: "", phone: "", role: "Agent", projectId: "" });
      fetchTeam();
    } catch (e) {
      toast.error('Failed to create agent');
    }
  };

  const handleToggleStatus = (agentId: string) => {
    const agent = agentsList.find(a => a.id === agentId);
    if (!agent) return;

    const nextIsActive = agent.status !== 'Active';

    managerTeamService
      .updateStatus(agentId, nextIsActive)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'Failed to update status');
        toast.success(`${agent.name} status changed to ${nextIsActive ? 'Active' : 'Inactive'}`);
        fetchTeam();
      })
      .catch(() => {
        toast.error('Failed to update status');
      });
  };

  const handleViewProfile = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsViewProfileOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditAgent({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      projectId: ""
    });
    setIsEditAgentOpen(true);
  };

  const handleAssignLeads = (agent: Agent) => {
    setSelectedAgent(agent);
    setSelectedLeads(new Set());
    setIsAssignLeadsOpen(true);
  };

  const handleUpdateAgent = () => {
    if (!selectedAgent) return;
    
    const updatedAgents = agentsList.map(a => 
      a.id === selectedAgent.id ? { ...a, ...editAgent } : a
    );
    setAgentsList(updatedAgents);
    toast.success(`${selectedAgent.name} updated successfully`);
    setIsEditAgentOpen(false);
    setSelectedAgent(null);
    setEditAgent({ name: "", email: "", phone: "", role: "Agent", projectId: "" });
  };

  const handleConfirmAssignLeads = () => {
    if (!selectedAgent) return;
    
    toast.success(`Leads assigned to ${selectedAgent.name}`);
    setIsAssignLeadsOpen(false);
    setSelectedAgent(null);
    setSelectedLeads(new Set());
  };

  return (
    <PageWrapper title="Team Management" description="Manage your sales team and agents." sidebarCollapsed={sidebarCollapsed}
      actions={<Button className="w-full sm:w-auto" size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add User</Button>}>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Team" value={agentsList.length} icon={Users} delay={0} />
        <KPICard title="Active Agents" value={agentsList.filter(a => a.status === 'Active').length} icon={Users} iconColor="text-success" delay={0.1} />
        <KPICard title="Total Conversions" value={agentsList.reduce((s, a) => s + a.conversions, 0)} icon={TrendingUp} iconColor="text-info" delay={0.2} />
        <KPICard title="Team Revenue" value="₹17.8Cr" icon={TrendingUp} delay={0.3} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search team members..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedAgents.map((agent) => (
          <Card key={agent.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-primary">{agent.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h4 className="font-semibold">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewProfile(agent)}>View Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditAgent(agent)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAssignLeads(agent)}>Assign Leads</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Leads</span>
                <span className="font-medium">{agent.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">{agent.conversions}</span>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">{(agent.totalLeads ? ((agent.conversions / agent.totalLeads) * 100) : 0).toFixed(0)}%</span>
                </div>
                <Progress value={agent.totalLeads ? (agent.conversions / agent.totalLeads) * 100 : 0} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium text-primary">{agent.revenue}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm">Status</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={agent.status === 'Active'} 
                    onCheckedChange={() => handleToggleStatus(agent.id)} 
                  />
                  <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>{agent.status}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle><DialogDescription>Add a new user to your team.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="John Doe" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="john@company.com" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 98765 43210" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign to Project</Label>
              <Select value={newUser.projectId} onValueChange={(v) => setNewUser({...newUser, projectId: v})}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projectOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agent Profile</DialogTitle>
            <DialogDescription>Complete information about this team member.</DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{selectedAgent.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="font-semibold">{selectedAgent.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedAgent.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedAgent.status === 'Active' ? 'default' : 'secondary'}>{selectedAgent.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="font-semibold">{selectedAgent.totalLeads}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                  <p className="font-semibold">{selectedAgent.conversions}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="font-semibold text-primary">{selectedAgent.revenue}</p>
                </div>
              </div>
              {selectedAgent.project && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Project</p>
                  <p className="font-semibold">{selectedAgent.project}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => setIsViewProfileOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={isEditAgentOpen} onOpenChange={setIsEditAgentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update team member information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Enter full name" value={editAgent.name} onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={editAgent.email} onChange={(e) => setEditAgent({ ...editAgent, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={editAgent.phone} onChange={(e) => setEditAgent({ ...editAgent, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editAgent.role} onValueChange={(v) => setEditAgent({ ...editAgent, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agent">Agent</SelectItem>
                    <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to Project</Label>
                <Select value={editAgent.projectId} onValueChange={(v) => setEditAgent({ ...editAgent, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projectOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditAgentOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleUpdateAgent}>Update Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Leads Modal */}
      <Dialog open={isAssignLeadsOpen} onOpenChange={setIsAssignLeadsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Leads</DialogTitle>
            <DialogDescription>Assign leads to {selectedAgent?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Available Leads</Label>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total available leads: 15</p>
                <p className="text-sm text-muted-foreground">High priority: 5</p>
                <p className="text-sm text-muted-foreground">Medium priority: 7</p>
                <p className="text-sm text-muted-foreground">Low priority: 3</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignment Notes</Label>
              <textarea 
                className="w-full p-2 border rounded-md" 
                rows={3}
                placeholder="Add any notes about this lead assignment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAssignLeadsOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleConfirmAssignLeads}>Assign Leads</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
