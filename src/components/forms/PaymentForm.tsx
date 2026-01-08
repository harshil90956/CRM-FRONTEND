import { useState, useEffect } from "react";
import { IndianRupee, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { mockApi } from "@/lib/mockApi";
import { units as defaultUnits } from "@/data/mockData";

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const paymentMethods = [
  { value: "token", label: "Token Payment" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];

const paymentTypes = [
  { value: "Booking", label: "Booking Amount" },
  { value: "Down Payment", label: "Down Payment" },
  { value: "Milestone", label: "Milestone Payment" },
  { value: "Final", label: "Final Payment" },
];

const initialPayment = {
  customer: "",
  unit: "",
  amount: "",
  type: "Booking",
  method: "bank",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export const PaymentForm = ({ open, onOpenChange, onSuccess }: PaymentFormProps) => {
  const [payment, setPayment] = useState(initialPayment);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const stored = mockApi.getAll("units");
    setUnits(stored.length > 0 ? stored : defaultUnits);
  }, [open]);

  const bookedUnits = units.filter((u) => u.status === "Booked" || u.status === "Hold");

  const handleSubmit = async () => {
    if (!payment.customer || !payment.unit || !payment.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const newPayment = await mockApi.post("/payments", {
        ...payment,
        status: "Received",
        receiptNo: `RCP-${Date.now()}`,
      });
      setReceiptId((newPayment as any).id);
      toast.success("Payment recorded successfully");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    // Create a mock receipt as a blob
    const receiptContent = `
PAYMENT RECEIPT
===============

Receipt No: RCP-${Date.now()}
Date: ${payment.date}

Customer: ${payment.customer}
Unit: ${payment.unit}
Amount: ${payment.amount}
Payment Type: ${payment.type}
Payment Method: ${paymentMethods.find(m => m.value === payment.method)?.label}

Notes: ${payment.notes || "N/A"}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  const handleClose = () => {
    setPayment(initialPayment);
    setReceiptId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a new payment for a booking or milestone.
          </DialogDescription>
        </DialogHeader>

        {!receiptId ? (
          <>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name *</Label>
                  <Input
                    id="customer"
                    placeholder="Enter customer name"
                    value={payment.customer}
                    onChange={(e) => setPayment({ ...payment, customer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit *</Label>
                  <Select
                    value={payment.unit}
                    onValueChange={(v) => setPayment({ ...payment, unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookedUnits.length > 0 ? (
                        bookedUnits.map((u) => (
                          <SelectItem key={u.id} value={u.unitNo}>
                            {u.unitNo} - {u.project}
                          </SelectItem>
                        ))
                      ) : (
                        units.slice(0, 5).map((u) => (
                          <SelectItem key={u.id} value={u.unitNo}>
                            {u.unitNo} - {u.project}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    placeholder="e.g., ₹25L"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={payment.type}
                    onValueChange={(v) => setPayment({ ...payment, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={payment.method}
                    onValueChange={(v) => setPayment({ ...payment, method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={payment.date}
                    onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={payment.notes}
                  onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Recorded!</h3>
            <p className="text-muted-foreground mb-6">
              Payment of {payment.amount} has been recorded successfully.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button className="w-full sm:w-auto" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
