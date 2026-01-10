import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Home, Building2, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CardEnhanced } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Unit } from "@/data/mockData";
import { getUnitDisplayType, getUnitArea, formatPrice, isResidential } from "@/lib/unitHelpers";
import { HoldUnitModal } from "@/components/booking/HoldUnitModal";
import { httpClient, reviewsService } from "@/api";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { useAppStore } from "@/stores/appStore";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ProjectReviewsSection } from "@/components/reviews/ProjectReviewsSection";

export const CustomerPropertiesPage = () => {
  const { currentUser } = useAppStore();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [holdModalOpen, setHoldModalOpen] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [approvedCountByUnitId, setApprovedCountByUnitId] = useState<Map<string, number>>(new Map());
  const [submittedReviewByUnitId, setSubmittedReviewByUnitId] = useState<Map<string, { status: "pending" | "approved" }>>(new Map());
  const [myReviewByUnitId, setMyReviewByUnitId] = useState<Map<string, { id?: string; rating?: number; comment?: string; status?: string }>>(new Map());
  const [myReviewOpen, setMyReviewOpen] = useState(false);
  const [myReviewView, setMyReviewView] = useState<{ unitId: string; unitName: string } | null>(null);
  const [myReviewMode, setMyReviewMode] = useState<"view" | "edit">("view");

  const [publicReviewsOpen, setPublicReviewsOpen] = useState(false);
  const [publicReviewsTarget, setPublicReviewsTarget] = useState<{ id: string; name: string } | null>(null);

  const getMyReviewStorageKey = () => {
    const userId = String((currentUser as any)?.id || "");
    return `reviews:my_review:customer:${userId}:properties`;
  };

  const loadMyReviewsFromStorage = () => {
    try {
      const key = getMyReviewStorageKey();
      if (!key) return;
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, { id?: string; rating?: number; comment?: string; status?: string }>;
      const next = new Map<string, { id?: string; rating?: number; comment?: string; status?: string }>();
      Object.entries(parsed || {}).forEach(([k, v]) => {
        next.set(String(k), v);
      });
      setMyReviewByUnitId(next);
    } catch {
      setMyReviewByUnitId(new Map());
    }
  };

  const persistMyReviewsToStorage = (next: Map<string, { id?: string; rating?: number; comment?: string; status?: string }>) => {
    try {
      const key = getMyReviewStorageKey();
      if (!key) return;
      const obj: Record<string, any> = {};
      next.forEach((v, k) => {
        obj[String(k)] = v;
      });
      sessionStorage.setItem(key, JSON.stringify(obj));
    } catch {
      // ignore
    }
  };

  const loadApprovedCounts = async () => {
    try {
      const res = await reviewsService.managerList();
      const rows = (((res as any)?.data ?? []) as any[]).filter((r) => r?.type === 'property' && r?.status === 'approved');
      const next = new Map<string, number>();
      rows.forEach((r) => {
        const key = String(r.targetId || '');
        if (!key) return;
        next.set(key, (next.get(key) ?? 0) + 1);
      });
      setApprovedCountByUnitId(next);
    } catch {
      setApprovedCountByUnitId(new Map());
    }
  };

  const loadUnits = async () => {
    const res = await httpClient.get<Unit[]>("/units");
    setUnits(((res as any)?.data ?? []) as Unit[]);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    loadApprovedCounts();
  }, []);

  useEffect(() => {
    loadMyReviewsFromStorage();
  }, [currentUser?.id]);

  useEffect(() => {
    const onRefresh = () => loadUnits();
    window.addEventListener("storage", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener("storage", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, []);

  const handleHoldUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setHoldModalOpen(true);
  };

  const handleHoldSuccess = () => {
    if (!currentUser?.id) return;
    if (!selectedUnit) return;
    const unitId = String((selectedUnit as any)?.id || "");
    const unitName = String((selectedUnit as any)?.unitNo || (selectedUnit as any)?.project || "");
    if (!unitId) return;
    setReviewTarget({ id: unitId, name: unitName });
    setReviewModalOpen(true);
  };

  const handleWriteReview = (unit: Unit) => {
    if (!currentUser?.id) return;
    const unitId = String((unit as any)?.id || "");
    const unitName = String((unit as any)?.unitNo || (unit as any)?.project || "");
    if (!unitId) return;
    setReviewTarget({ id: unitId, name: unitName });
    setReviewModalOpen(true);
  };

  const openPublicReviews = (unitId: string, unitName: string) => {
    setPublicReviewsTarget({ id: String(unitId), name: String(unitName) });
    setPublicReviewsOpen(true);
  };

  const getSubmittedStatus = (unitId: string): "pending" | "approved" | null => {
    return submittedReviewByUnitId.get(unitId)?.status ?? null;
  };

  const getMyReview = (unitId: string) => {
    return myReviewByUnitId.get(unitId) ?? null;
  };

  const openMyReview = (unitId: string, unitName: string) => {
    setMyReviewView({ unitId: String(unitId), unitName: String(unitName) });
    setMyReviewMode("view");
    setMyReviewOpen(true);
  };

  const openMyReviewEdit = (unitId: string, unitName: string) => {
    setMyReviewView({ unitId: String(unitId), unitName: String(unitName) });
    setMyReviewMode("edit");
    setMyReviewOpen(true);
  };

  const extractReviewFields = (raw: any): { id?: string; rating: number; comment: string } | null => {
    if (!raw) return null;
    // support shapes like: {data: review}, {review: review}, {data:{review}}, or raw review
    const candidate = raw?.review ?? raw?.data?.review ?? raw?.data ?? raw;
    const id = candidate?.id ?? raw?.id;
    const rating = Number(candidate?.rating ?? raw?.rating ?? 0);
    const comment = String(candidate?.comment ?? raw?.comment ?? "");
    return { id: id ? String(id) : undefined, rating, comment };
  };

  const availableUnits = units.filter(u => u.status === 'AVAILABLE');
  const filteredUnits = availableUnits.filter(u => {
    const matchesSearch = (u.project || '').toLowerCase().includes(search.toLowerCase()) || u.unitNo.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || (isResidential(u) && `${u.bedrooms} BHK` === typeFilter);
    return matchesSearch && matchesType;
  });

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 12 });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, budgetFilter, setPage]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/customer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">RealCRM Properties</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/customer/properties" className="text-sm font-medium text-primary">Properties</Link>
            <Link to="/customer/projects" className="text-sm text-muted-foreground hover:text-foreground">Projects</Link>
            <Link to="/customer/bookings" className="text-sm text-muted-foreground hover:text-foreground">My Bookings</Link>
            <Link to="/customer/payments" className="text-sm text-muted-foreground hover:text-foreground">Payments</Link>
            <Link to="/customer/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/customer/bookings"><Button variant="outline" size="sm">My Bookings</Button></Link>
            <Link to="/customer/payments"><Button variant="outline" size="sm">Payments</Button></Link>
            <Link to="/customer/auth"><Button size="sm">Sign In</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Available Properties</h1>
          <p className="text-muted-foreground">Find your perfect home from our curated selection</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by project or unit..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Unit Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="1 BHK">1 BHK</SelectItem>
              <SelectItem value="2 BHK">2 BHK</SelectItem>
              <SelectItem value="3 BHK">3 BHK</SelectItem>
              <SelectItem value="4 BHK">4 BHK</SelectItem>
            </SelectContent>
          </Select>
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Budget" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Budgets</SelectItem>
              <SelectItem value="50-75">₹50L - ₹75L</SelectItem>
              <SelectItem value="75-100">₹75L - ₹1Cr</SelectItem>
              <SelectItem value="100-200">₹1Cr - ₹2Cr</SelectItem>
              <SelectItem value="200+">₹2Cr+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filteredUnits.length} properties found</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedUnits.map((unit, index) => (
            <motion.div key={unit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <CardEnhanced hover={true} className="overflow-hidden">
                <div className="h-40 bg-muted relative flex items-center justify-center">
                  <Home className="w-12 h-12 text-muted-foreground/30" />
                  <Badge className="absolute top-3 left-3 bg-success/90">Available</Badge>
                  <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-card/80 hover:bg-card transition-colors"><Heart className="w-4 h-4" /></Button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{unit.unitNo}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3.5 h-3.5" />{unit.project}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Star className="w-4 h-4" />
                    <button
                      type="button"
                      className="hover:underline"
                      onClick={() => openPublicReviews(String((unit as any)?.id || ""), String((unit as any)?.unitNo || unit.project || ""))}
                    >
                      {(approvedCountByUnitId.get(String((unit as any)?.id)) ?? 0)} reviews
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{getUnitDisplayType(unit)}</span>
                    <span>•</span>
                    <span>{getUnitArea(unit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</p>
                    <div className="flex flex-col items-end">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {Boolean(myReviewByUnitId.get(String((unit as any)?.id))?.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openMyReviewEdit(String((unit as any)?.id), String((unit as any)?.unitNo || (unit as any)?.project || ""))
                            }
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Edit Review
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWriteReview(unit)}
                            disabled={!currentUser?.id}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}

                        <Button size="sm" onClick={() => handleHoldUnit(unit)}>Hold Unit</Button>
                      </div>

                      {Boolean(myReviewByUnitId.get(String((unit as any)?.id))?.id) && (
                        <button
                          type="button"
                          className="mt-1 text-xs font-normal text-muted-foreground hover:underline"
                          onClick={() => openMyReview(String((unit as any)?.id), String((unit as any)?.unitNo || (unit as any)?.project || ""))}
                        >
                          view your review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardEnhanced>
            </motion.div>
          ))}
        </div>

        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
      </main>

      <HoldUnitModal
        open={holdModalOpen}
        onOpenChange={setHoldModalOpen}
        unit={selectedUnit}
        onSuccess={handleHoldSuccess}
      />

      {reviewTarget && currentUser?.id && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          target={{ type: "property", targetId: reviewTarget.id, targetName: reviewTarget.name }}
          customerId={currentUser.id}
          customerName={currentUser.name || ""}
          tenantId={(currentUser as any)?.tenantId || ""}
          onSubmitted={(createdOrUpdated) => {
            setSubmittedReviewByUnitId((prev) => {
              const next = new Map(prev);
              next.set(String(reviewTarget.id), { status: "approved" });
              return next;
            });

            const extracted = extractReviewFields(createdOrUpdated);
            if (extracted) {
              const { id, rating, comment } = extracted;
              setMyReviewByUnitId((prev) => {
                const next = new Map(prev);
                next.set(String(reviewTarget.id), { id, rating, comment, status: "approved" });
                persistMyReviewsToStorage(next);
                return next;
              });
            }
            loadApprovedCounts();
          }}
        />
      )}

      <Dialog
        open={myReviewOpen}
        onOpenChange={(open) => {
          setMyReviewOpen(open);
          if (!open) setMyReviewMode("view");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your Review</DialogTitle>
          </DialogHeader>
          {myReviewView && myReviewMode === "view" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{myReviewView.unitName}</p>
              </div>
              <div className="flex items-center gap-2">
                <RatingStars rating={Number(getMyReview(String(myReviewView.unitId))?.rating ?? 0)} size="sm" />
                <span className="text-xs text-muted-foreground">Status: Approved</span>
              </div>
              <p className="text-sm text-foreground/80">{String(getMyReview(String(myReviewView.unitId))?.comment ?? "") || "No comment provided"}</p>

              {Boolean(getMyReview(String(myReviewView.unitId))?.id) && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setMyReviewMode("edit")}>
                    Edit Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {myReviewView && myReviewMode === "edit" && currentUser?.id && (
            <ReviewForm
              reviewType="property"
              targetId={String(myReviewView.unitId)}
              targetName={String(myReviewView.unitName)}
              customerId={currentUser.id}
              customerName={currentUser.name || ""}
              tenantId={(currentUser as any)?.tenantId || ""}
              editData={{
                id: String(getMyReview(String(myReviewView.unitId))?.id || ""),
                rating: Number(getMyReview(String(myReviewView.unitId))?.rating ?? 0),
                comment: String(getMyReview(String(myReviewView.unitId))?.comment ?? ""),
              }}
              cancelLabel="Cancel"
              submitLabel="Save Changes"
              onCancel={() => setMyReviewMode("view")}
              onSuccess={(updated) => {
                const extracted = extractReviewFields(updated);
                if (extracted) {
                  const { id, rating, comment } = extracted;
                  setMyReviewByUnitId((prev) => {
                    const next = new Map(prev);
                    next.set(String(myReviewView.unitId), { id, rating, comment, status: "approved" });
                    persistMyReviewsToStorage(next);
                    return next;
                  });
                }
                setMyReviewMode("view");
                setMyReviewOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={publicReviewsOpen} onOpenChange={setPublicReviewsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Reviews</DialogTitle>
          </DialogHeader>
          {publicReviewsTarget && (
            <ProjectReviewsSection
              type="property"
              targetId={String(publicReviewsTarget.id)}
              tenantId={String((currentUser as any)?.tenantId || "")}
              currentUserId={String((currentUser as any)?.id || "")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};