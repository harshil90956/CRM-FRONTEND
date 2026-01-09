import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Unit } from "@/data/mockData";
import { formatPrice, getUnitDisplayType, getUnitArea } from "@/lib/unitHelpers";
import { bookingsService } from "@/api";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/stores/appStore";

interface HoldUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit | null;
  onSuccess?: () => void;
}

export const HoldUnitModal = ({ open, onOpenChange, unit, onSuccess }: HoldUnitModalProps) => {
  const { currentUser } = useAppStore();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tokenAmount: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;

    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'You must be logged in to request a hold.', variant: 'destructive' });
      return;
    }
    if (!unit.projectId) {
      toast({ title: 'Error', description: 'Unit is missing projectId. Cannot create booking.', variant: 'destructive' });
      return;
    }

    const tenantId = (currentUser as any)?.tenantId ?? (unit as any)?.tenantId;
    if (!tenantId) {
      toast({ title: 'Error', description: 'Missing tenantId. Cannot create booking.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await bookingsService.hold({
        status: 'HOLD_REQUESTED',
        unitId: unit.id,
        customerId: currentUser.id,
        projectId: unit.projectId,
        tenantId,
        totalPrice: unit.price,
        tokenAmount: Number(formData.tokenAmount),
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        notes: formData.notes || undefined,
      } as any);
      
      setBookingData((result as any)?.data ?? result);
      setStep('success');
      toast({ title: "Hold Request Submitted", description: "Your hold request has been submitted successfully." });
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to hold unit", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    toast({ title: 'Disabled', description: 'Receipt download is disabled until backend receipt endpoint exists.', variant: 'destructive' });
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ name: '', email: '', phone: '', tokenAmount: '', notes: '' });
    setBookingData(null);
    onOpenChange(false);
  };

  if (!unit) return null;

  const suggestedToken = Math.round(unit.price * 0.05);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 'form' ? 'Hold Unit' : 'Hold Request Submitted'}</DialogTitle>
          <DialogDescription>
            {step === 'form' 
              ? `Hold ${unit.unitNo} at ${unit.project}` 
              : 'Your request has been submitted successfully'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">{unit.unitNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{unit.project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{getUnitDisplayType(unit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area</span>
                <span className="font-medium">{getUnitArea(unit)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold text-primary">{formatPrice(unit.price)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Token Amount *</Label>
                <Input 
                  type="number"
                  value={formData.tokenAmount} 
                  onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                  placeholder={`Suggested: ₹${suggestedToken.toLocaleString()}`}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suggested token: 5% of unit price = {formatPrice(suggestedToken)}
                </p>
              </div>
              <div className="col-span-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes or requirements..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Hold Request
              </Button>
            </div>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Hold Request Submitted!</h3>
              <p className="text-muted-foreground">
                Your hold request for {unit.unitNo} has been submitted successfully. Our team will contact you shortly.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono">{bookingData?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-warning font-medium">PENDING</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Amount</span>
                <span className="font-semibold">{formatPrice(bookingData?.tokenAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hold Valid Until</span>
                <span>{bookingData?.holdExpiresAt ? new Date(bookingData.holdExpiresAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button className="flex-1" onClick={handleClose} disabled={loading}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
