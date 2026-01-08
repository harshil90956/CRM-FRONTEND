import { useState } from "react";
import { Target } from "lucide-react";
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
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";

interface GoalsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoalsForm = ({ open, onOpenChange }: GoalsFormProps) => {
  const { goals, setGoals } = useAppStore();
  const [localGoals, setLocalGoals] = useState(goals);

  const handleSave = () => {
    setGoals(localGoals);
    toast.success("Goals updated successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Set Monthly Goals
          </DialogTitle>
          <DialogDescription>
            Define your targets for the current period.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyTarget">Monthly Revenue Target (Cr)</Label>
            <Input
              id="monthlyTarget"
              type="number"
              value={localGoals.monthlyTarget}
              onChange={(e) =>
                setLocalGoals({ ...localGoals, monthlyTarget: Number(e.target.value) })
              }
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadsTarget">Leads Target</Label>
            <Input
              id="leadsTarget"
              type="number"
              value={localGoals.leadsTarget}
              onChange={(e) =>
                setLocalGoals({ ...localGoals, leadsTarget: Number(e.target.value) })
              }
              placeholder="200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conversionsTarget">Conversions Target</Label>
            <Input
              id="conversionsTarget"
              type="number"
              value={localGoals.conversionsTarget}
              onChange={(e) =>
                setLocalGoals({ ...localGoals, conversionsTarget: Number(e.target.value) })
              }
              placeholder="25"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Goals</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
