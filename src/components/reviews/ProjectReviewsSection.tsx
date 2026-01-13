import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { reviewsService, type ReviewDb } from "@/api";

type ProjectReviewsSectionProps = {
  type: "project";
  targetId: string;
  tenantId?: string;
  currentUserId?: string;
  onMeta?: (meta: { total: number; limit: number; offset: number }) => void;
};

export const ProjectReviewsSection = ({ type, targetId, tenantId, currentUserId, onMeta }: ProjectReviewsSectionProps) => {
  const [items, setItems] = useState<ReviewDb[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const normalizePage = (raw: any): { data: ReviewDb[]; meta: { total: number; limit: number; offset: number } } => {
    const page = (raw as any)?.data;
    const safeItems = (page?.data ?? []) as ReviewDb[];
    const meta = (page?.meta ?? { total: 0, limit: 10, offset: 0 }) as any;
    return {
      data: Array.isArray(safeItems) ? safeItems : [],
      meta: {
        total: Number(meta?.total) || 0,
        limit: Number(meta?.limit) || 10,
        offset: Number(meta?.offset) || 0,
      },
    };
  };

  const loadFirst = async () => {
    if (!type || !targetId) return;
    setItems([]);
    setTotal(0);
    setOffset(0);
    setIsLoading(true);
    try {
      const res = await reviewsService.publicList({ type, targetId, tenantId, limit: 10, offset: 0 });
      const page = normalizePage(res);
      setItems(page.data);
      setTotal(page.meta.total);
      setOffset(page.data.length);
      onMeta?.(page.meta);
    } catch {
      setItems([]);
      setTotal(0);
      setOffset(0);
      onMeta?.({ total: 0, limit: 10, offset: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!type || !targetId) return;
    if (items.length >= total) return;
    setIsLoadingMore(true);
    try {
      const res = await reviewsService.publicList({ type, targetId, tenantId, limit: 10, offset });
      const page = normalizePage(res);
      setItems((prev) => [...prev, ...page.data]);
      setTotal(page.meta.total);
      setOffset(offset + page.data.length);
      onMeta?.(page.meta);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, targetId, tenantId]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">All Reviews</h3>
      </div>

      {isLoading ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const isMine = currentUserId && String(r.customerId) === String(currentUserId);
            const createdLabel = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "";

            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={Number(r.rating || 0)} size="sm" />
                      {isMine && <Badge variant="secondary">Your review</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{r.customerName || "Anonymous"}{createdLabel ? ` • ${createdLabel}` : ""}</p>
                    <p className="text-xs text-muted-foreground">Verified Customer</p>
                  </div>
                </div>
                <p className="text-sm mt-3">{r.comment}</p>
              </Card>
            );
          })}

          {items.length < total && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load more reviews"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
