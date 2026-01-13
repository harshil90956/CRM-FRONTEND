import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Home, Building2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CardEnhanced } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService, paymentsService, publicProjectsService } from "@/api";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useAppStore } from "@/stores/appStore";
import { useQuery } from "@tanstack/react-query";
import type { PublicProjectCard } from "@/api/services/public-projects.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export const CustomerPropertiesPage = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const unitIdParam = String(searchParams.get('unit') || '').trim();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    const guardAccess = async () => {
      const customerId = String((currentUser as any)?.id || '').trim();
      if (!customerId) return;

      try {
        const [bookingsRes, paymentsRes] = await Promise.all([
          bookingsService.list(),
          paymentsService.list(),
        ]);

        const bookings = (((bookingsRes as any)?.data ?? []) as any[])
          .filter((b) => String(b.customerId || '') === customerId)
          .filter((b) => !['CANCELLED', 'REFUNDED'].includes(String(b.status || '')));

        if (bookings.length === 0) return;

        const bookingIds = new Set(bookings.map((b) => String(b.id)));
        const payments = ((paymentsRes as any)?.data ?? []) as any[];
        const hasReceived = payments.some((p) => bookingIds.has(String(p.bookingId || '')) && String(p.status || '') === 'Received');

        if (!hasReceived) {
          toast({
            title: 'Payment required',
            description: 'First token payment must be recorded before browsing properties.',
            variant: 'destructive',
          });
          navigate('/customer/bookings');
        }
      } catch {
        // If access check fails, do not block browsing.
      }
    };

    guardAccess();
  }, [currentUser, navigate]);

  const { data: projectsRes } = useQuery({
    queryKey: ['publicGlobalProjects'],
    queryFn: () => publicProjectsService.globalList(),
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  const projects = (projectsRes?.success ? (projectsRes.data || []) : []) as PublicProjectCard[];

  const { data: unitsRes, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['publicGlobalAllUnits'],
    queryFn: () => publicProjectsService.globalListAllUnits(),
    enabled: !unitIdParam,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  const { data: unitRes, isLoading: isUnitLoading } = useQuery({
    queryKey: ['publicGlobalUnit', unitIdParam],
    queryFn: () => publicProjectsService.globalGetUnit(unitIdParam),
    enabled: !!unitIdParam,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
  });

  const rawUnits: any[] = (unitsRes as any)?.success ? ((unitsRes as any)?.data || []) : [];
  const rawUnit: any = (unitRes as any)?.success ? (unitRes as any)?.data : null;

  const formatPriceInr = (price: number) => {
    const value = Number(price) || 0;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const matchesBudget = (price: number, filter: string) => {
    const p = Number(price) || 0;
    if (filter === 'all') return true;
    if (filter === '50-75') return p >= 50_00_000 && p < 75_00_000;
    if (filter === '75-100') return p >= 75_00_000 && p < 1_00_00_000;
    if (filter === '100-200') return p >= 1_00_00_000 && p < 2_00_00_000;
    if (filter === '200+') return p >= 2_00_00_000;
    return true;
  };

  const units = useMemo(() => {
    const projectById = new Map<string, PublicProjectCard>();
    projects.forEach((p) => projectById.set(String(p.id), p));

    const normalized = rawUnits.map((u: any) => {
      const unitNo = String(u?.unitNo || u?.unitNumber || '').trim();
      const projectId = String(u?.projectId || '').trim();
      const project = projectById.get(projectId);
      const projectName = String(project?.name || '');
      const projectLocation = String(project?.location || '');
      return {
        ...u,
        id: String(u?.id || ''),
        unitNo,
        projectId,
        projectName,
        projectLocation,
        mainType: 'Residential',
        status: 'AVAILABLE',
      };
    });

    return normalized;
  }, [rawUnits, projects]);

  const unitDetails = useMemo(() => {
    if (!rawUnit) return null;
    const projectById = new Map<string, PublicProjectCard>();
    projects.forEach((p) => projectById.set(String(p.id), p));

    const projectId = String(rawUnit?.projectId || '').trim();
    const project = projectById.get(projectId);
    return {
      ...rawUnit,
      id: String(rawUnit?.id || ''),
      unitNo: String(rawUnit?.unitNo || rawUnit?.unitNumber || '').trim(),
      projectId,
      projectName: String(project?.name || ''),
      projectLocation: String(project?.location || ''),
      mainType: 'Residential',
      status: 'AVAILABLE',
    };
  }, [rawUnit, projects]);

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u: any) => {
      const matchesSearch =
        !q ||
        String(u.unitNo || '').toLowerCase().includes(q) ||
        String(u.projectName || '').toLowerCase().includes(q) ||
        String(u.projectLocation || '').toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || String(u.mainType).toLowerCase() === String(typeFilter).toLowerCase();
      const matchesB = matchesBudget(Number(u.price || 0), budgetFilter);
      return matchesSearch && matchesType && matchesB;
    });
  }, [units, search, typeFilter, budgetFilter]);

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 12 });

  const getStoredCustomerPhone = (): string => {
    if (typeof window === 'undefined') return '';
    return String(sessionStorage.getItem('crm_customerPhone') || '').trim();
  };

  const storeCustomerPhone = (phone: string) => {
    if (typeof window === 'undefined') return;
    const p = String(phone || '').trim();
    if (!p) return;
    sessionStorage.setItem('crm_customerPhone', p);
  };

  const createBooking = async (customerPhone: string) => {
    if (!unitDetails) return;
    const customerId = String((currentUser as any)?.id || '').trim();
    if (!customerId) {
      toast({ title: 'Sign in required', description: 'Please sign in to book this unit.' });
      navigate('/customer/auth');
      return;
    }

    const tenantId = String((unitDetails as any)?.tenantId || '').trim();
    const unitId = String((unitDetails as any)?.id || '').trim();
    const projectId = String((unitDetails as any)?.projectId || '').trim();
    const totalPrice = Number((unitDetails as any)?.price || 0);

    const customerName = String((currentUser as any)?.name || '').trim();
    const customerEmail = String((currentUser as any)?.email || '').trim();
    const phone = String(customerPhone || '').trim();

    if (!tenantId || !unitId || !projectId) {
      toast({ title: 'Cannot book', description: 'Missing unit/project information. Please refresh and try again.' });
      return;
    }
    if (!customerName || !customerEmail || !phone) {
      toast({ title: 'Cannot book', description: 'Please provide name, email and phone to continue.' });
      return;
    }
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      toast({ title: 'Cannot book', description: 'Invalid unit price. Please contact support.' });
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const tokenAmount = Math.max(1, Math.round(totalPrice * 0.1));
      const holdExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await bookingsService.hold({
        status: 'HOLD_REQUESTED',
        unitId,
        customerId,
        projectId,
        tenantId,
        totalPrice,
        tokenAmount,
        holdExpiresAt,
        customerName,
        customerEmail,
        customerPhone: phone,
        notes: 'Customer booking from properties page',
      });

      if (!(res as any)?.success) {
        toast({ title: 'Booking failed', description: String((res as any)?.message || 'Please try again.') });
        return;
      }

      toast({ title: 'Booking created', description: 'Your booking request has been submitted.' });

      navigate('/customer/bookings');
    } catch (e: any) {
      toast({ title: 'Booking failed', description: String(e?.message || 'Please try again.') });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleBookNow = async () => {
    if (!unitDetails) return;

    const phoneFromUser = String((currentUser as any)?.phone || '').trim();
    const phoneFromStorage = getStoredCustomerPhone();
    const phone = phoneFromUser || phoneFromStorage;

    if (!phone) {
      setPhoneInput('');
      setPhoneDialogOpen(true);
      return;
    }

    await createBooking(phone);
  };

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
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
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

        {!unitIdParam && (
          <>
            <p className="text-sm text-muted-foreground mb-4">{isUnitsLoading ? 'Loading...' : `${filteredUnits.length} properties found`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedUnits.map((unit: any, index: number) => (
                <motion.div key={unit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <CardEnhanced hover={true} className="overflow-hidden h-full flex flex-col">
                    <div className="h-40 bg-muted relative flex items-center justify-center shrink-0">
                      <Home className="w-12 h-12 text-muted-foreground/30" />
                      <Badge className="absolute top-3 left-3 bg-success/90">Available</Badge>
                      <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-card/80 hover:bg-card transition-colors"><Heart className="w-4 h-4" /></Button>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">{String(unit.unitNo || '')}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />{String(unit.projectLocation || '')}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{String(unit.mainType || '')}</span>
                        <span>•</span>
                        <span>{String(unit.projectName || '')}</span>
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-end justify-between gap-3">
                          <p className="text-lg font-semibold text-primary">{formatPriceInr(Number(unit.price || 0))}</p>
                          <Button size="sm" onClick={() => setSearchParams({ unit: String(unit.id) })}>View Details</Button>
                        </div>
                      </div>
                    </div>
                  </CardEnhanced>
                </motion.div>
              ))}
            </div>
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
          </>
        )}

        {unitIdParam && (
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground mb-4">{isUnitLoading ? 'Loading...' : 'Property details'}</p>
            {unitDetails && (
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{String(unitDetails.unitNo || '')}</h2>
                    <p className="text-sm text-muted-foreground">{String(unitDetails.projectName || '')}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" />{String(unitDetails.projectLocation || '')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPriceInr(Number((unitDetails as any)?.price || 0))}</p>
                    <Badge className="mt-2 bg-success/90">Available</Badge>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={() => { searchParams.delete('unit'); setSearchParams(searchParams); }}>Back</Button>
                  <Button onClick={handleBookNow} disabled={isBookingSubmitting}>{isBookingSubmitting ? 'Booking...' : 'Book Now'}</Button>
                </div>
              </Card>
            )}
          </div>
        )}

        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Phone Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Phone number is required to create a booking.</p>
              <Input
                placeholder="e.g. +91 98765 43210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPhoneDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    const p = String(phoneInput || '').trim();
                    if (!p) {
                      toast({ title: 'Phone required', description: 'Please enter a valid phone number.' });
                      return;
                    }
                    storeCustomerPhone(p);
                    setPhoneDialogOpen(false);
                    await createBooking(p);
                  }}
                  disabled={isBookingSubmitting}
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};