import { motion } from "framer-motion";
import { MoreHorizontal, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Fragment } from "react";
import { leadsService } from "@/api";
import type { LeadDb } from "@/api/services/leads.service";
import { useAppStore } from "@/stores/appStore";

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: "status-new",
    CONTACTED: "status-contacted",
    QUALIFIED: "status-qualified",
    NEGOTIATION: "status-booked",
    CONVERTED: "status-available",
    LOST: "status-lost",
  };
  return styles[status] || "";
};

interface LeadsTableProps {
  limit?: number;
  showActions?: boolean;
}

export const LeadsTable = ({ limit, showActions = true }: LeadsTableProps) => {
  const { toast } = useToast();
  const { currentUser } = useAppStore();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadDb | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    projectId: '',
    status: '',
  });
  
  // State management for leads - this is the single source of truth
  const [leadsData, setLeadsData] = useState<LeadDb[]>([]);
  const displayLeads = limit ? leadsData.slice(0, limit) : leadsData;

  useEffect(() => {
    void (async () => {
      try {
        const role = String(currentUser?.role || '').toUpperCase();
        const res =
          role === 'ADMIN' || role === 'SUPER_ADMIN'
            ? await leadsService.listAdminLeads()
            : role === 'MANAGER'
              ? ({ success: true, data: await leadsService.listManagerLeads() } as any)
              : role === 'AGENT'
                ? await leadsService.listAgentLeads()
                : await leadsService.list();
        if (!res.success) {
          throw new Error(res.message || 'Failed to load leads');
        }
        setLeadsData(res.data || []);
      } catch {
        toast({
          title: 'Failed to load leads',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    })();
  }, [toast, currentUser?.role]);

  // Handler functions
  const handleViewDetails = (lead: any) => {
    // Find the current lead from state to get updated data
    const currentLead = leadsData.find(l => l.id === lead.id);
    setSelectedLead(currentLead || lead);
    setDetailsDialogOpen(true);
  };

  const handleEditLead = (lead: any) => {
    // Find the current lead from state to get updated data
    const currentLead = leadsData.find(l => l.id === lead.id);
    const leadToEdit = currentLead || lead;
    
    setSelectedLead(leadToEdit);
    setEditForm({
      name: leadToEdit.name,
      phone: leadToEdit.phone,
      email: leadToEdit.email || '',
      budget: leadToEdit.budget,
      projectId: leadToEdit.projectId || '',
      status: leadToEdit.status,
    });
    setEditDialogOpen(true);
  };

  const handleCall = (lead: any) => {
    // Find the current lead from state to get updated data
    const currentLead = leadsData.find(l => l.id === lead.id);
    const leadToCall = currentLead || lead;
    
    if (leadToCall.phone) {
      window.open(`tel:${leadToCall.phone}`, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This lead doesn't have a phone number available.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = (lead: any) => {
    // Find the current lead from state to get updated data
    const currentLead = leadsData.find(l => l.id === lead.id);
    const leadToEmail = currentLead || lead;
    
    const subject = encodeURIComponent("Regarding Your Property Inquiry");
    const body = encodeURIComponent(`Dear ${leadToEmail.name},\n\nI hope this email finds you well. I'm following up on your property inquiry.\n\nBest regards,\nReal Estate Agent`);
    window.open(`mailto:${leadToEmail.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDelete = (lead: any) => {
    setSelectedLead(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast({
      title: "Delete is not implemented",
      description: "Backend delete endpoint for leads is not implemented yet.",
      variant: "destructive",
    });
    setDeleteDialogOpen(false);
    setSelectedLead(null);
  };

  const saveEdit = () => {
    toast({
      title: "Edit is not implemented",
      description: "Backend update endpoint for leads is not implemented yet.",
      variant: "destructive",
    });
    setEditDialogOpen(false);
  };

  return (
    <Fragment>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="table-container"
      >
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Lead</TableHead>
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="font-semibold">Budget</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Assigned To</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              {showActions && <TableHead className="font-semibold text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLeads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="hover:bg-table-row-hover transition-colors"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{lead.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{lead.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.project?.name || lead.projectId || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground">{lead.budget}</TableCell>
                <TableCell>
                  <span className={cn("status-badge", getStatusStyle(lead.status))}>
                    {lead.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.assignedTo?.name || lead.assignedToId || 'Unassigned'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {lead.source}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCall(lead)}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendEmail(lead)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(lead)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Complete information about this lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedLead.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Budget</Label>
                  <p className="font-medium">{selectedLead.budget}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Project</Label>
                  <p className="font-medium">{selectedLead.projectId || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <span className={cn("status-badge", getStatusStyle(selectedLead.status))}>
                    {selectedLead.status}
                  </span>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Assigned To</Label>
                  <p className="font-medium">{selectedLead.assignedToId || 'Unassigned'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Source</Label>
                  <p className="font-medium">{selectedLead.source}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={editForm.projectId}
                  onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                You are about to delete <span className="font-medium">{selectedLead.name}</span>.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};
