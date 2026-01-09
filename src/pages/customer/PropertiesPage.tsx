import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Home, Building2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CardEnhanced } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Unit } from "@/data/mockData";
import { getUnitDisplayType, getUnitArea, formatPrice, isResidential } from "@/lib/unitHelpers";
import { HoldUnitModal } from "@/components/booking/HoldUnitModal";
import { httpClient } from "@/api";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const CustomerPropertiesPage = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [holdModalOpen, setHoldModalOpen] = useState(false);

  const loadUnits = async () => {
    const res = await httpClient.get<Unit[]>("/units");
    setUnits(((res as any)?.data ?? []) as Unit[]);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    const onRefresh = () => loadUnits();
    window.addEventListener("storage", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener("storage", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, []);

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

  const handleHoldUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setHoldModalOpen(true);
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{getUnitDisplayType(unit)}</span>
                    <span>•</span>
                    <span>{getUnitArea(unit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</p>
                    <Button size="sm" onClick={() => handleHoldUnit(unit)}>Hold Unit</Button>
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
        onSuccess={() => {}}
      />
    </div>
  );
};