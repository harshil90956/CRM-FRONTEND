import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { remindersService } from "@/api";
import type { AgentReminderDb } from "@/api/services/reminders.service";

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export const AgentRemindersPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const [reminders, setReminders] = useState<AgentReminderDb[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<AgentReminderDb | null>(null);
  const [editAt, setEditAt] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await remindersService.getMyReminders();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load reminders');
      }
      setReminders(res.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reminders';
      toast.error(message);
      setReminders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(() => {
    return (reminders || []).slice().sort((a, b) => {
      const ta = new Date(a.remindAt).getTime();
      const tb = new Date(b.remindAt).getTime();
      return ta - tb;
    });
  }, [reminders]);

  const openEdit = (r: AgentReminderDb) => {
    setEditing(r);
    try {
      const dt = new Date(r.remindAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      setEditAt(local);
    } catch {
      setEditAt('');
    }
    setEditNote((r.note || '') as string);
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editAt) {
      toast.error('Please select reminder date and time');
      return;
    }

    const dt = new Date(editAt);
    if (Number.isNaN(dt.getTime())) {
      toast.error('Invalid reminder time');
      return;
    }
    if (dt.getTime() <= Date.now()) {
      toast.error('Reminder time must be in the future');
      return;
    }

    setIsSaving(true);
    try {
      const res = await remindersService.updateReminder(editing.id, {
        remindAt: dt.toISOString(),
        ...(editNote.trim() ? { note: editNote.trim() } : { note: '' }),
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update reminder');
      }

      try {
        window.dispatchEvent(
          new CustomEvent('crm:reminder-scheduled', {
            detail: {
              id: editing.id,
              remindAt: dt.toISOString(),
              title: (editing as any)?.title || 'Reminder',
              message: (editing as any)?.message || '',
              note: editNote.trim() ? editNote.trim() : undefined,
              targetName: (editing as any)?.targetName,
              targetId: (editing as any)?.targetId,
            },
          }),
        );
      } catch {
      }
      toast.success('Reminder updated successfully');
      setIsEditOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update reminder';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      const res = await remindersService.cancelReminder(id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to cancel reminder');
      }
      toast.success('Reminder cancelled');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel reminder';
      toast.error(message);
    }
  };

  return (
    <PageWrapper title="My Reminders" description="View and manage your scheduled reminders." sidebarCollapsed={sidebarCollapsed}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {isLoading ? 'Loading…' : `${sorted.length} reminder(s)`}
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Remind At</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.targetName || r.targetId}</div>
                  <div className="text-xs text-muted-foreground">{r.targetId}</div>
                </TableCell>
                <TableCell>{formatDateTime(r.remindAt)}</TableCell>
                <TableCell className="max-w-[420px]">
                  <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{r.note || '-'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === 'PENDING' ? 'default' : r.status === 'SENT' ? 'secondary' : 'outline'}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {r.status === 'PENDING' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                          Update
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void cancel(r.id)}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {r.status !== 'PENDING' && (
                      <span className="text-xs text-muted-foreground">No actions</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  No reminders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Reminder</DialogTitle>
            <DialogDescription>Update the reminder time or note.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={editAt} onChange={(e) => setEditAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Note (optional)</Label>
              <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={isSaving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
