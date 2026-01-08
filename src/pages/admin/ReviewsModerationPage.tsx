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
import { mockApi } from "@/lib/mockApi";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const ReviewsModerationPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  
  // Local mock reviews data - 4-5 records
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev_1',
      type: 'property',
      targetId: 'proj_1',
      targetName: 'Green Valley',
      customerId: 'u_cust_1',
      customerName: 'Arjun Nair',
      rating: 5,
      comment: 'Excellent project with great amenities. Very satisfied with the purchase.',
      status: 'approved',
      tenantId: 't_soundarya',
      createdAt: '2024-01-18'
    },
    {
      id: 'rev_2',
      type: 'agent',
      targetId: 'u_agent_1',
      targetName: 'Rahul Verma',
      customerId: 'u_cust_2',
      customerName: 'Sneha Reddy',
      rating: 5,
      comment: 'Very helpful and professional. Made the entire process smooth.',
      status: 'pending',
      tenantId: 't_soundarya',
      createdAt: '2024-01-16'
    },
    {
      id: 'rev_3',
      type: 'property',
      targetId: 'proj_2',
      targetName: 'Sky Heights',
      customerId: 'u_cust_3',
      customerName: 'Vikram Mehta',
      rating: 4,
      comment: 'Good location and construction quality. Slightly delayed possession.',
      status: 'approved',
      tenantId: 't_prestige',
      createdAt: '2024-01-14'
    },
    {
      id: 'rev_4',
      type: 'property',
      targetId: 'proj_3',
      targetName: 'Palm Residency',
      customerId: 'u_cust_4',
      customerName: 'Divya Pillai',
      rating: 5,
      comment: 'Premium project with excellent sea view. Worth the investment.',
      status: 'pending',
      tenantId: 't_prestige',
      createdAt: '2024-01-12'
    },
    {
      id: 'rev_5',
      type: 'agent',
      targetId: 'u_agent_2',
      targetName: 'Neha Gupta',
      customerId: 'u_cust_5',
      customerName: 'Rajesh Kumar',
      rating: 3,
      comment: 'Average service. Could be more proactive in providing updates.',
      status: 'rejected',
      tenantId: 't_soundarya',
      createdAt: '2024-01-10'
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchReviews = async () => {
    // Data is already in local state, no need to fetch from API
    setIsLoading(false);
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
    // Update local state immediately
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    toast.success("Review approved");
  };

  const handleReject = async (id: string) => {
    // Update local state immediately
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    toast.success("Review rejected");
  };

  const handleDelete = async (id: string) => {
    // Update local state immediately
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Review deleted");
  };

  const handleBulkApprove = async () => {
    // Update local state immediately
    setReviews(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: "approved" } : r));
    toast.success(`${selectedIds.length} reviews approved`);
    setSelectedIds([]);
  };

  const handleBulkReject = async () => {
    // Update local state immediately
    setReviews(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: "rejected" } : r));
    toast.success(`${selectedIds.length} reviews rejected`);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    // Update local state immediately
    setReviews(prev => prev.filter(r => !selectedIds.includes(r.id)));
    toast.success(`${selectedIds.length} reviews deleted`);
    setSelectedIds([]);
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
