import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paymentsService, type PaymentDb, type UpdatePaymentInput } from "@/api";
import { useToast } from "@/hooks/use-toast";

type PaymentDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string | null;
  role: 'admin' | 'manager' | 'agent' | 'customer';
  onUpdated?: () => void;
};

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const fromDatetimeLocal = (value: string) => {
  const d = new Date(value);
  return d.toISOString();
};

export const PaymentDetailDrawer = ({ open, onOpenChange, paymentId, role, onUpdated }: PaymentDetailDrawerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentDb | null>(null);
  const [paidAtInput, setPaidAtInput] = useState<string>("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const [edit, setEdit] = useState<UpdatePaymentInput>({});

  const canManage = role === 'admin' || role === 'manager';

  const status = payment?.status ?? '';

  useEffect(() => {
    const run = async () => {
      if (!open || !paymentId) return;
      setLoading(true);
      try {
        const res = await paymentsService.getById(paymentId);
        const data = ((res as any)?.data ?? null) as PaymentDb | null;
        setPayment(data);
        setEdit({
          amount: typeof data?.amount === 'number' ? data.amount : undefined,
          paymentType: (data?.paymentType ?? null) as any,
          notes: (data?.notes ?? null) as any,
          receiptNo: (data?.receiptNo ?? null) as any,
        });
        setPaidAtInput(data?.paidAt ? toDatetimeLocal(data.paidAt) : toDatetimeLocal(new Date().toISOString()));
      } catch {
        toast({ title: 'Error', description: 'Failed to load payment', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, paymentId, toast]);

  const headerBadges = useMemo(() => {
    if (!payment) return null;
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{payment.paymentType ?? 'Payment'}</Badge>
        <Badge variant={payment.status === 'Received' ? 'default' : payment.status === 'Refunded' ? 'secondary' : 'outline'} className="text-xs">
          {payment.status}
        </Badge>
      </div>
    );
  }, [payment]);

  const handleSave = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await paymentsService.update(paymentId, edit);
      const data = ((res as any)?.data ?? null) as PaymentDb | null;
      setPayment(data);
      toast({ title: 'Saved', description: 'Payment updated.' });
      onUpdated?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to update payment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async () => {
    if (!paymentId) return;
    if (!paidAtInput) {
      toast({ title: 'Required', description: 'paidAt is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await paymentsService.markReceived(paymentId, {
        status: 'Received',
        paidAt: fromDatetimeLocal(paidAtInput),
        receiptNo: (edit as any)?.receiptNo ?? undefined,
      });
      const data = ((res as any)?.data ?? null) as PaymentDb | null;
      setPayment(data);
      toast({ title: 'Received', description: 'Payment marked as received.' });
      onUpdated?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to mark received', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await paymentsService.cancel(paymentId, {
        status: 'Refunded',
        refundRefId: (edit as any)?.refundRefId ?? undefined,
        notes: (edit as any)?.notes ?? undefined,
        paidAt: null,
      });
      const data = ((res as any)?.data ?? null) as PaymentDb | null;
      setPayment(data);
      toast({ title: 'Refunded', description: 'Payment cancelled/refunded.' });
      onUpdated?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel payment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Payment Details</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-col gap-2">
              <span>Payment ID: {paymentId ?? '-'}</span>
              {headerBadges}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto pr-1">
          {!paymentId ? (
            <div className="p-6 text-sm text-muted-foreground">No payment selected.</div>
          ) : loading && !payment ? (
            <div className="p-6 text-sm text-muted-foreground">Loading payment...</div>
          ) : !payment ? (
            <div className="p-6 text-sm text-muted-foreground">Payment not found.</div>
          ) : (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">₹{Number(payment.amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">{payment.status}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={typeof edit.amount === 'number' ? String(edit.amount) : ''}
                    onChange={(e) => setEdit((p) => ({ ...p, amount: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    disabled={!canManage || loading}
                  />
                </div>

                <div>
                  <Label>Payment Type</Label>
                  <Input
                    value={typeof edit.paymentType === 'string' ? edit.paymentType : ''}
                    onChange={(e) => setEdit((p) => ({ ...p, paymentType: e.target.value }))}
                    disabled={!canManage || loading}
                  />
                </div>

                <div>
                  <Label>Receipt No</Label>
                  <Input
                    value={typeof edit.receiptNo === 'string' ? edit.receiptNo : ''}
                    onChange={(e) => setEdit((p) => ({ ...p, receiptNo: e.target.value }))}
                    disabled={!canManage || loading}
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={typeof edit.notes === 'string' ? edit.notes : ''}
                    onChange={(e) => setEdit((p) => ({ ...p, notes: e.target.value }))}
                    disabled={!canManage || loading}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>paidAt *</Label>
                  <Input
                    type="datetime-local"
                    value={paidAtInput}
                    onChange={(e) => setPaidAtInput(e.target.value)}
                    disabled={!canManage || loading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          {canManage && (
            <>
              <Button onClick={handleSave} disabled={loading || !paymentId} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleMarkReceived}
                disabled={loading || !paymentId || status === 'Received' || status === 'Refunded'}
                className="flex-1"
              >
                Mark Received
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRefundDialogOpen(true)}
                disabled={loading || !paymentId || status === 'Refunded'}
                className="flex-1"
              >
                Refund
              </Button>
            </>
          )}
        </div>

        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Refund Payment</DialogTitle>
              <DialogDescription>Confirm refund/cancel payment. You can optionally add a reason in notes.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={typeof edit.notes === 'string' ? edit.notes : ''}
                onChange={(e) => setEdit((p) => ({ ...p, notes: e.target.value }))}
                disabled={!canManage || loading}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundDialogOpen(false)} disabled={loading}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setRefundDialogOpen(false);
                  await handleCancel();
                }}
                disabled={loading || !paymentId || status === 'Refunded'}
              >
                Confirm Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
