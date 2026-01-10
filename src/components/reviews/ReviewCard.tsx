import { format } from "date-fns";
import { Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./RatingStars";
import { Review } from "@/data/mockData";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ReviewCardProps {
  review: Review;
  showStatus?: boolean;
  showActions?: boolean;
  currentUserId?: string;
  highlight?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onApprove?: (reviewId: string) => void;
  onReject?: (reviewId: string) => void;
}

export const ReviewCard = ({
  review,
  showStatus = false,
  showActions = false,
  currentUserId,
  highlight = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: ReviewCardProps) => {
  const statusColors = {
    pending: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const isMine =
    !!currentUserId &&
    (String((review as any)?.customerId || "") === String(currentUserId) ||
      String((review as any)?.agentId || "") === String(currentUserId));

  return (
    <Card className={highlight ? "p-4 border-primary/40 bg-primary/5" : "p-4"}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {review.customerName.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{review.customerName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <RatingStars rating={review.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              for {review.targetName}
            </span>
            {isMine && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Your Review
              </Badge>
            )}
            {showStatus && (
              <Badge variant="outline" className={statusColors[review.status]}>
                {review.status}
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground/80 mb-3">{review.comment}</p>

          {highlight && isMine && (
            <p className="text-xs text-muted-foreground mb-3">This review was added by you</p>
          )}

          {review.images && review.images.length > 0 && (
            <div className="flex gap-2">
              {review.images.map((img, idx) => (
                <Dialog key={idx}>
                  <DialogTrigger asChild>
                    <button className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity">
                      <img
                        src={img}
                        alt={`Review image ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <img src={img} alt={`Review image ${idx + 1}`} className="w-full h-auto" />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-1">
            {review.status === "pending" && onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(review)}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {review.status === "pending" && onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(review.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
            {onApprove && review.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => onApprove(review.id)}>
                Approve
              </Button>
            )}
            {onReject && review.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => onReject(review.id)}>
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
