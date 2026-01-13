import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Building2, Heart, ChevronRight, ArrowLeft, Phone, Mail, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { publicProjectsService, reviewsService } from "@/api";
import { useAppStore } from "@/stores/appStore";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ProjectReviewsSection } from "@/components/reviews/ProjectReviewsSection";
import { useQuery } from "@tanstack/react-query";
import type { PublicProjectCard } from "@/api/services/public-projects.service";

export const CustomerProjectsPage = () => {
  const { currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const navigate = useNavigate();

  const { data: projectsRes, isLoading } = useQuery({
    queryKey: ['publicGlobalProjects'],
    queryFn: () => publicProjectsService.globalList(),
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  const projects = (projectsRes?.success ? (projectsRes.data || []) : []) as PublicProjectCard[];

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [approvedCountByProjectId, setApprovedCountByProjectId] = useState<Map<string, number>>(new Map());
  const [publicTotalForSelectedProject, setPublicTotalForSelectedProject] = useState<number | null>(null);
  const [submittedReviewByProjectId, setSubmittedReviewByProjectId] = useState<Map<string, { status: "pending" | "approved" }>>(new Map());
  const [myReviewByProjectId, setMyReviewByProjectId] = useState<Map<string, { id?: string; rating?: number; comment?: string; status?: string }>>(new Map());
  const [myReviewOpen, setMyReviewOpen] = useState(false);
  const [myReviewView, setMyReviewView] = useState<{ projectId: string; projectName: string } | null>(null);
  const [myReviewMode, setMyReviewMode] = useState<"view" | "edit">("view");

  const getMyReviewStorageKey = () => {
    const userId = String((currentUser as any)?.id || "");
    return `reviews:my_review:customer:${userId}:projects`;
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
      setMyReviewByProjectId(next);
    } catch {
      setMyReviewByProjectId(new Map());
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
      const next = new Map<string, number>();
      await Promise.all(
        projects.map(async (p) => {
          const projectId = String((p as any)?.id || "");
          if (!projectId) return;
          try {
            const res = await reviewsService.publicList({ type: 'project', targetId: projectId, limit: 1, offset: 0 });
            const meta = (res as any)?.data?.meta;
            const total = Number(meta?.total) || 0;
            next.set(projectId, total);
          } catch {
            next.set(projectId, 0);
          }
        }),
      );

      setApprovedCountByProjectId(next);
    } catch {
      setApprovedCountByProjectId(new Map());
    }
  };

  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      const project = projects.find((p) => String(p.id) === String(projectId));
      if (project) {
        setSelectedProject({
          ...project,
          priceRange: `${project.startingPrice ? `₹${Number(project.startingPrice).toLocaleString('en-IN')}` : ''}`,
          status: 'Active',
          totalUnits: project.availableUnitsCount,
          availableUnits: project.availableUnitsCount,
          soldUnits: 0,
          bookedUnits: 0,
          amenities: [],
          mainType: project.mainType,
        });
        setPublicTotalForSelectedProject(null);
      }
    } else {
      setSelectedProject(null);
      setPublicTotalForSelectedProject(null);
    }
  }, [searchParams, projects]);

  useEffect(() => {
    loadApprovedCounts();
  }, [projects.length]);

  useEffect(() => {
    loadMyReviewsFromStorage();
  }, [currentUser?.id]);

  const handleBackToList = () => {
    setSelectedProject(null);
    // Navigate to projects page without any parameters
    navigate('/customer/projects');
  };

  const handleScheduleVisit = () => {
    if (selectedProject) {
      // Navigate to contact page with project info for scheduling visit
      navigate(`/customer/contact?project=${selectedProject.id}&action=schedule-visit`);
    }
  };

  const handleGetDetails = () => {
    if (selectedProject) {
      // Navigate to contact page with project info for getting details
      navigate(`/customer/contact?project=${selectedProject.id}&action=get-details`);
    }
  };

  const handleWriteReview = (project: any) => {
    if (!currentUser?.id) {
      navigate('/customer/auth');
      return;
    }
    setReviewTarget({ id: project.id, name: project.name });
    setReviewModalOpen(true);
  };

  const getSubmittedStatus = (projectId: string): "pending" | "approved" | null => {
    return submittedReviewByProjectId.get(projectId)?.status ?? null;
  };

  const getMyReview = (projectId: string) => {
    return myReviewByProjectId.get(projectId) ?? null;
  };

  const openMyReview = (projectId: string, projectName: string) => {
    setMyReviewView({ projectId: String(projectId), projectName: String(projectName) });
    setMyReviewMode("view");
    setMyReviewOpen(true);
  };

  const openMyReviewEdit = (projectId: string, projectName: string) => {
    setMyReviewView({ projectId: String(projectId), projectName: String(projectName) });
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

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const { page, setPage, totalPages, pageItems: paginatedProjects } = useClientPagination(filteredProjects, { pageSize: 9 });

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

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
            <Link to="/customer/properties" className="text-sm text-muted-foreground hover:text-foreground">Properties</Link>
            <Link to="/customer/projects" className="text-sm font-medium text-primary">Projects</Link>
            <Link to="/customer/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link>
            <Link to="/customer/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/customer/profile"><Button variant="ghost" size="icon"><Heart className="w-5 h-5" /></Button></Link>
            <Link to="/customer/auth"><Button size="sm">Sign In</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {selectedProject ? (
          // Project Details View
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={handleBackToList} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Image */}
              <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="w-24 h-24 text-muted-foreground/30" />
              </div>
              
              {/* Project Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{selectedProject.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedProject.location}
                    </div>
                    <Badge variant={selectedProject.status === 'Active' ? 'default' : 'secondary'}>
                      {selectedProject.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>
                        {(publicTotalForSelectedProject ?? (approvedCountByProjectId.get(String(selectedProject.id)) ?? 0))} reviews
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">{selectedProject.priceRange}</p>
                    <p className="text-sm text-muted-foreground">Price Range</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{selectedProject.totalUnits}</p>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-success">{selectedProject.availableUnits}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-info">{selectedProject.soldUnits}</p>
                    <p className="text-sm text-muted-foreground">Sold</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProject.amenities ?? []).map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button className="flex-1" size="lg" onClick={handleScheduleVisit}>
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Visit
                  </Button>
                  <Button variant="outline" className="flex-1" size="lg" onClick={handleGetDetails}>
                    <Mail className="w-4 h-4 mr-2" />
                    Get Details
                  </Button>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {Boolean(getMyReview(String(selectedProject.id))?.id) ? (
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => openMyReviewEdit(String(selectedProject.id), String(selectedProject.name))}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Edit Review
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" onClick={() => handleWriteReview(selectedProject)}>
                      <Star className="w-4 h-4 mr-2" />
                      Write a Review
                    </Button>
                  )}

                  {Boolean(
                    getMyReview(String(selectedProject.id))?.id ||
                      getMyReview(String(selectedProject.id))?.rating ||
                      getMyReview(String(selectedProject.id))?.comment
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => openMyReview(String(selectedProject.id), String(selectedProject.name))}
                    >
                      View Your Review
                    </Button>
                  )}
                </div>

                <ProjectReviewsSection
                  type="project"
                  targetId={String(selectedProject.id)}
                  tenantId={String((currentUser as any)?.tenantId || "") || undefined}
                  currentUserId={String((currentUser as any)?.id || "")}
                  onMeta={(meta) => setPublicTotalForSelectedProject(Number(meta?.total) || 0)}
                />
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Project Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium">{selectedProject.mainType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Booked Units</span>
                    <span className="font-medium">{selectedProject.bookedUnits}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Sold Progress</span>
                    <span className="font-medium">{Math.round((selectedProject.soldUnits / selectedProject.totalUnits) * 100)}%</span>
                  </div>
                  <div className="py-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="font-medium">{Math.round((selectedProject.availableUnits / selectedProject.totalUnits) * 100)}%</span>
                    </div>
                    <Progress value={(selectedProject.availableUnits / selectedProject.totalUnits) * 100} className="h-2" />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Sales Hotline</p>
                      <p className="text-muted-foreground">+91 1800 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">sales@realcrm.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Site Office</p>
                      <p className="text-muted-foreground">{selectedProject.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Visit Hours</p>
                      <p className="text-muted-foreground">9:00 AM - 7:00 PM (Mon-Sat)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Projects List View
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Our Projects</h1>
              <p className="text-muted-foreground">Explore premium developments from leading builders</p>
            </div>

            <div className="relative max-w-md mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-9" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading projects...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((project: any, index) => (
                <motion.div 
                  key={project.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-muted relative flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-muted-foreground/30" />
                      <Badge className={`absolute top-3 left-3 bg-success/90`}>
                        Active
                      </Badge>
                      <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-card/80">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-semibold mb-1">{project.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-3.5 h-3.5" />
                        {project.location}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Star className="w-4 h-4" />
                        <span>{approvedCountByProjectId.get(String(project.id)) ?? 0} reviews</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Sold Progress</span>
                          <span className="font-medium">{Math.round((project.soldUnits / project.totalUnits) * 100)}%</span>
                        </div>
                        <Progress value={(project.soldUnits / project.totalUnits) * 100} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-lg font-semibold text-success">{project.availableUnits}</p>
                          <p className="text-xs text-muted-foreground">Available</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-lg font-semibold text-warning">{project.bookedUnits}</p>
                          <p className="text-xs text-muted-foreground">Booked</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-lg font-semibold text-info">{project.soldUnits}</p>
                          <p className="text-xs text-muted-foreground">Sold</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-lg font-semibold text-primary">{`₹${Number(project.startingPrice || 0).toLocaleString('en-IN')}`}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {Boolean(getMyReview(String(project.id))?.id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openMyReviewEdit(String(project.id), String(project.name))}
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Edit Review
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleWriteReview(project)}>
                                <Star className="w-4 h-4 mr-1" />
                                Write Review
                              </Button>
                            )}

                            <Button size="sm" onClick={() => navigate(`/customer/projects?project=${project.id}`)}>
                              View Details
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>

                          {Boolean(getMyReview(String(project.id))?.id) && (
                            <button
                              type="button"
                              className="mt-1 text-xs font-normal text-muted-foreground hover:underline"
                              onClick={() => openMyReview(String(project.id), String(project.name))}
                            >
                              view your review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            )}

            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
          </div>
        )}
      </main>

      {reviewTarget && currentUser?.id && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          target={{ type: "project", targetId: reviewTarget.id, targetName: reviewTarget.name }}
          customerId={currentUser.id}
          customerName={currentUser.name || ""}
          tenantId={(currentUser as any)?.tenantId || ""}
          onSubmitted={(createdOrUpdated) => {
            setSubmittedReviewByProjectId((prev) => {
              const next = new Map(prev);
              next.set(String(reviewTarget.id), { status: "approved" });
              return next;
            });

            const extracted = extractReviewFields(createdOrUpdated);
            if (extracted) {
              const { id, rating, comment } = extracted;
              setMyReviewByProjectId((prev) => {
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
                <p className="text-sm text-muted-foreground">{myReviewView.projectName}</p>
              </div>
              <div className="flex items-center gap-2">
                <RatingStars rating={Number(getMyReview(String(myReviewView.projectId))?.rating ?? 0)} size="sm" />
                <span className="text-xs text-muted-foreground">Status: Approved</span>
              </div>
              <p className="text-sm text-foreground/80">{String(getMyReview(String(myReviewView.projectId))?.comment ?? "") || "No comment provided"}</p>

              {Boolean(getMyReview(String(myReviewView.projectId))?.id) && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setMyReviewMode("edit")}>
                    Edit Review
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">This review is now visible in public reviews.</p>
            </div>
          )}

          {myReviewView && myReviewMode === "edit" && currentUser?.id && (
            <ReviewForm
              reviewType="project"
              targetId={String(myReviewView.projectId)}
              targetName={String(myReviewView.projectName)}
              customerId={currentUser.id}
              customerName={currentUser.name || ""}
              tenantId={(currentUser as any)?.tenantId || ""}
              editData={{
                id: String(getMyReview(String(myReviewView.projectId))?.id || ""),
                rating: Number(getMyReview(String(myReviewView.projectId))?.rating ?? 0),
                comment: String(getMyReview(String(myReviewView.projectId))?.comment ?? ""),
              }}
              cancelLabel="Cancel"
              submitLabel="Save Changes"
              onCancel={() => setMyReviewMode("view")}
              onSuccess={(updated) => {
                const extracted = extractReviewFields(updated);
                if (extracted) {
                  const { id, rating, comment } = extracted;
                  setMyReviewByProjectId((prev) => {
                    const next = new Map(prev);
                    next.set(String(myReviewView.projectId), { id, rating, comment, status: "approved" });
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
    </div>
  );
};
