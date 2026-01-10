import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Review } from "@/data/mockData";
import { reviewsService } from "@/api";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const ReviewsModerationPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewsService.adminList();
      setReviews(((res as any)?.data ?? []) as Review[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleApprove = async (id: string) => {
    await reviewsService.adminApprove(id);
    toast.success("Review approved");
    fetchReviews();
  };

  const handleReject = async (id: string) => {
    await reviewsService.adminReject(id);
    toast.success("Review rejected");
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    await reviewsService.adminDelete(id);
    toast.success("Review deleted");
    fetchReviews();
  };

  const handleBulkApprove = async () => {
    await Promise.all(selectedIds.map((id) => reviewsService.adminApprove(id)));
    toast.success(`${selectedIds.length} reviews approved`);
    setSelectedIds([]);
    fetchReviews();
  };

  const handleBulkReject = async () => {
    await Promise.all(selectedIds.map((id) => reviewsService.adminReject(id)));
    toast.success(`${selectedIds.length} reviews rejected`);
    setSelectedIds([]);
    fetchReviews();
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedIds.map((id) => reviewsService.adminDelete(id)));
    toast.success(`${selectedIds.length} reviews deleted`);
    setSelectedIds([]);
    fetchReviews();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const { page, setPage, totalPages, pageItems: paginatedPendingReviews } = useClientPagination(pendingReviews, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [pendingReviews.length, setPage]);

  return (
    <PageWrapper
      title="Reviews Moderation"
      description="Approve, reject, or delete customer reviews."
      sidebarCollapsed={sidebarCollapsed}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Pending Reviews"
          value={pendingReviews.length}
          icon={MessageSquare}
          iconColor="text-warning"
          delay={0}
        />
        <KPICard
          title="Approved Reviews"
          value={approvedReviews.length}
          icon={CheckCircle}
          iconColor="text-success"
          delay={0.1}
        />
        <KPICard
          title="Total Reviews"
          value={reviews.length}
          icon={Star}
          delay={0.2}
        />
        <KPICard
          title="Average Rating"
          value={avgRating}
          icon={Star}
          iconColor="text-warning"
          delay={0.3}
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4"
        >
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkApprove}>
            <CheckCircle className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkReject}>
            <XCircle className="w-4 h-4 mr-1" /> Reject
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </motion.div>
      )}

      {/* Selection checkboxes + Review List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-3">
          {paginatedPendingReviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3">
              <Checkbox
                checked={selectedIds.includes(review.id)}
                onCheckedChange={() => toggleSelect(review.id)}
                className="mt-4"
              />
              <div className="flex-1">
                <ReviewList
                  reviews={[review]}
                  showStatus
                  showActions
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ))}
        </div>

        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

        {pendingReviews.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No pending reviews to moderate
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
};
