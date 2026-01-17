import { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  X, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  User, 
  Calendar,
  MessageSquare,
  Send,
  UserMinus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { leadsService } from "@/api";
import type { LeadActivityDb, LeadDb } from "@/api/services/leads.service";
import { useAppStore } from "@/stores/appStore";

interface LeadDetailModalProps {
  lead: (Omit<LeadDb, 'assignedTo'> & { assignedTo?: string | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-purple-100 text-purple-700',
    FOLLOWUP: 'bg-yellow-100 text-yellow-700',
    QUALIFIED: 'bg-green-100 text-green-700',
    NEGOTIATION: 'bg-orange-100 text-orange-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
};

const getNoteIcon = (type: string) => {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Calendar;
    default: return MessageSquare;
  }
};

const safeFormat = (value: unknown, fmt: string): string => {
  try {
    const d = new Date(String(value || ''));
    if (!Number.isFinite(d.getTime())) return 'N/A';
    return format(d, fmt);
  } catch {
    return 'N/A';
  }
};

export const LeadDetailModal = ({ lead, open, onOpenChange }: LeadDetailModalProps) => {
  const { currentUser } = useAppStore();
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');
  const [closeReason, setCloseReason] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [activities, setActivities] = useState<LeadActivityDb[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  const canViewActivities = currentUser?.role === 'AGENT' || currentUser?.role === 'MANAGER';
  const leadId = lead?.id;

  const loadActivities = async () => {
    if (!leadId) return;
    if (!canViewActivities) {
      setActivities([]);
      return;
    }

    setIsActivitiesLoading(true);
    try {
      const res =
        currentUser?.role === 'MANAGER'
          ? await leadsService.listManagerLeadActivities(leadId)
          : await leadsService.listAgentLeadActivities(leadId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load activities');
      }
      setActivities(res.data || []);
    } catch {
      setActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!leadId) return;
    void loadActivities();
  }, [open, leadId, canViewActivities]);

  if (!lead) return null;

  const handleAddNote = async () => {
    if (currentUser?.role !== 'AGENT') {
      toast.error('Only assigned agent can add activity');
      return;
    }

    const note = String(newNote || '').trim();
    if (!note) {
      toast.error('Please enter a note');
      return;
    }

    const typeMap: Record<typeof noteType, 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE'> = {
      call: 'CALL',
      email: 'EMAIL',
      meeting: 'MEETING',
      note: 'NOTE',
    };

    try {
      const res = await leadsService.logAgentLeadActivity(lead.id, {
        activityType: typeMap[noteType],
        notes: note,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to save activity');
      }
      setNewNote('');
      toast.success('Activity saved');
      await loadActivities();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save activity';
      toast.error(msg);
    }
  };

  const handleCloseLead = () => {
    toast.error('Close lead is not implemented on backend yet');
    setShowCloseDialog(false);
    setCloseReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{lead.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{lead.email}</p>
            </div>
            <Badge className={cn("text-xs font-medium", getStatusStyle(lead.status))}>
              {lead.status}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="text-sm font-medium">{lead.projectId || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">{lead.budget}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-medium">{lead.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{safeFormat(lead.createdAt, 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Activity</h3>
              {!canViewActivities ? (
                <p className="text-sm text-muted-foreground">Activities are not available for this role.</p>
              ) : isActivitiesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => {
                    const Icon = getNoteIcon(String(a.type || '').toLowerCase());
                    return (
                      <div key={a.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium truncate">{a.creator?.name || 'Activity'}</p>
                            <p className="text-xs text-muted-foreground">{safeFormat(a.createdAt, 'MMM dd, yyyy • HH:mm')}</p>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{a.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Note */}
            <div>
              <h3 className="font-semibold mb-4">Add Note</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={noteType} onValueChange={(v: any) => setNoteType(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea 
                  placeholder="Enter your note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>

            {/* Close Lead */}
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
              <>
                <Separator />
                {!showCloseDialog ? (
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Close Lead
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <Label>Reason for closing (min 10 characters)</Label>
                    <Textarea 
                      placeholder="Enter reason for closing this lead..."
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCloseDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleCloseLead}
                      >
                        Confirm Close
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
