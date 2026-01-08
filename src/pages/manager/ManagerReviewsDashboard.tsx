import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Users, MessageSquare, TrendingUp } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Review, agents } from "@/data/mockData";
import { mockApi } from "@/lib/mockApi";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const ManagerReviewsDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const data = await mockApi.get<Review[]>("/reviews");
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  
  const agentReviews = reviews.filter((r) => r.type === "agent" && r.status === "approved");
  const agentRatings = agents.map((agent) => {
    const agentRevs = agentReviews.filter((r) => r.targetId === agent.id);
    const avgRating = agentRevs.length > 0
      ? agentRevs.reduce((sum, r) => sum + r.rating, 0) / agentRevs.length
      : 0;
    return { agent, avgRating, count: agentRevs.length };
  }).sort((a, b) => b.avgRating - a.avgRating);

  const { page, setPage, totalPages, pageItems: paginatedAgentRatings } = useClientPagination(agentRatings, { pageSize: 10 });

  const avgOverall = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
    : "0.0";

  return (
    <PageWrapper
      title="Reviews Dashboard"
      description="Overview of team and property reviews."
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
          icon={Star}
          iconColor="text-success"
          delay={0.1}
        />
        <KPICard
          title="Average Rating"
          value={avgOverall}
          icon={TrendingUp}
          iconColor="text-primary"
          delay={0.2}
        />
        <KPICard
          title="Team Members"
          value={agents.length}
          icon={Users}
          delay={0.3}
        />
      </div>

      {/* Agent Ratings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Performance by Reviews</h2>
          <div className="space-y-4">
            {paginatedAgentRatings.map(({ agent, avgRating, count }, idx) => (
              <div
                key={agent.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {agent.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <RatingStars rating={Math.round(avgRating)} size="sm" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {count} review{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {avgRating.toFixed(1)}
                  </Badge>
                </div>
              </div>
            ))}

            {agentRatings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No agent reviews yet
              </div>
            )}
          </div>

          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
        </Card>
      </motion.div>
    </PageWrapper>
  );
};
