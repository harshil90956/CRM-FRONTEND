import { useState } from "react";
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
import type { LeadDb } from "@/api/services/leads.service";

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

export const LeadDetailModal = ({ lead, open, onOpenChange }: LeadDetailModalProps) => {
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');
  const [closeReason, setCloseReason] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  if (!lead) return null;

  const handleAddNote = () => {
    toast.error('Activity/notes are not implemented on backend yet');
    setNewNote('');
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
                  <p className="text-sm font-medium">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            <Separator />

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
