import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "./ReviewForm";

type ReviewTarget = {
  type: "property" | "agent" | "project";
  targetId: string;
  targetName: string;
};

type ReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  target: ReviewTarget;
  customerId: string;
  customerName: string;
  tenantId: string;
  onSubmitted?: (createdOrUpdated?: any) => void;
};

export const ReviewModal = ({
  open,
  onOpenChange,
  title,
  target,
  customerId,
  customerName,
  tenantId,
  onSubmitted,
}: ReviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title || "Write a Review"}</DialogTitle>
          <DialogDescription>
            Share your experience. Your review helps others make better decisions.
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          reviewType={target.type}
          targetId={target.targetId}
          targetName={target.targetName}
          customerId={customerId}
          customerName={customerName}
          tenantId={tenantId}
          onSuccess={(createdOrUpdated) => {
            onOpenChange(false);
            onSubmitted?.(createdOrUpdated);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
