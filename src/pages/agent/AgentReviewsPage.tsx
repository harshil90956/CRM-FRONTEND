import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewList } from "@/components/reviews/ReviewList";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Review } from "@/data/mockData";
import { reviewsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

export const AgentReviewsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await reviewsService.agentList(currentUser?.id || "");
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

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <PageWrapper
      title="My Reviews"
      description="View reviews from your customers."
      sidebarCollapsed={sidebarCollapsed}
    >
      <Card className="p-4 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Review visibility</p>
            <p className="text-sm text-muted-foreground">
              These are reviews written by customers about you. Only <span className="font-medium">approved</span> reviews are shown here.
            </p>
          </div>
          <Badge variant="outline">Visible to you only</Badge>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Average Rating"
          value={avgRating.toFixed(1)}
          icon={Star}
          iconColor="text-warning"
          delay={0}
        />
        <KPICard
          title="Total Reviews"
          value={reviews.length}
          icon={MessageSquare}
          delay={0.1}
        />
        <KPICard
          title="5-Star Reviews"
          value={reviews.filter((r) => r.rating === 5).length}
          icon={TrendingUp}
          iconColor="text-success"
          delay={0.2}
        />
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 col-span-1">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-foreground mb-2">
              {avgRating.toFixed(1)}
            </div>
            <RatingStars rating={Math.round(avgRating)} size="lg" />
            <p className="text-sm text-muted-foreground mt-2">
              Based on {reviews.length} reviews
            </p>
          </div>

          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm w-3">{star}</span>
                <Star className="w-4 h-4 text-warning fill-warning" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ReviewList reviews={reviews} currentUserId={currentUser?.id || ""} />
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};
