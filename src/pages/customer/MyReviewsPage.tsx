import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Review } from "@/data/mockData";
import { reviewsService } from "@/api";
import { toast } from "sonner";
import { useAppStore } from "@/stores/appStore";

export const MyReviewsPage = () => {
  const { currentUser } = useAppStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await reviewsService.customerList(currentUser?.id || "");
      setReviews(((res as any)?.data ?? []) as Review[]);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentUser]);

  const handleEdit = (review: Review) => {
    if (review.status !== "pending") {
      toast.error("Only pending reviews can be edited");
      return;
    }
    setEditReview(review);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const review = reviews.find((r) => r.id === id);
    if (review?.status !== "pending") {
      toast.error("Only pending reviews can be deleted");
      return;
    }
    await reviewsService.customerUpdate(id, { customerId: currentUser?.id || "", delete: true } as any);
    toast.success("Review deleted");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditReview(null);
  };

  const applyUpsertReview = (raw: any) => {
    if (!raw) return;
    const nextReview = raw as Review;
    setReviews((prev) => {
      const idx = prev.findIndex((r) => String(r.id) === String(nextReview.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = nextReview;
        return copy;
      }
      return [nextReview, ...prev];
    });
    if (nextReview?.id) {
      setHighlightReviewId(String(nextReview.id));
      window.setTimeout(() => setHighlightReviewId(null), 6000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Reviews</h1>
            <p className="text-muted-foreground">View and manage your submitted reviews</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Write Review
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {!isLoading && (
            <ReviewList
              reviews={reviews}
              showStatus
              showActions
              currentUserId={currentUser?.id || ""}
              highlightReviewId={highlightReviewId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </motion.div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editReview ? "Edit Review" : "Write a Review"}
              </DialogTitle>
            </DialogHeader>
            <ReviewForm
              customerId={currentUser?.id || ""}
              customerName={currentUser?.name || ""}
              tenantId="t_soundarya"
              onSuccess={(createdOrUpdated) => {
                applyUpsertReview(createdOrUpdated);
                handleFormSuccess();
              }}
              onCancel={() => { setShowForm(false); setEditReview(null); }}
              editData={editReview ? {
                id: editReview.id,
                rating: editReview.rating,
                comment: editReview.comment,
                images: editReview.images,
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
