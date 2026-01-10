import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./ReviewCard";
import { Review } from "@/data/mockData";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  showStatus?: boolean;
  showActions?: boolean;
  showFilters?: boolean;
  pageSize?: number;
  currentUserId?: string;
  highlightReviewId?: string | null;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onApprove?: (reviewId: string) => void;
  onReject?: (reviewId: string) => void;
  onRefresh?: () => void;
}

export const ReviewList = ({
  reviews,
  showStatus = false,
  showActions = false,
  showFilters = false,
  pageSize = 10,
  currentUserId,
  highlightReviewId = null,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onRefresh,
}: ReviewListProps) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");
  const [search, setSearch] = useState("");

  const filtered = reviews
    .filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (search && !r.comment.toLowerCase().includes(search.toLowerCase()) && 
          !r.customerName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, search, sortBy]);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="property">Property</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: "date" | "rating") => setSortBy(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No reviews found
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showStatus={showStatus}
              showActions={showActions}
              currentUserId={currentUserId}
              highlight={!!highlightReviewId && String(highlightReviewId) === String(review.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
