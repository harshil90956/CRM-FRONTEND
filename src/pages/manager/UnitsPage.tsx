import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Home, Search, Plus, Grid, List } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UnitDb } from "@/api/services/units.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUnitDisplayType, getUnitArea, getUnitLocation, formatPrice, getStatusLabel } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { UnitForm } from "@/components/forms/UnitForm";
import { unitsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

export const ManagerUnitsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();

  const canWriteUnits = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const [units, setUnits] = useState<UnitDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUnitForm, setShowUnitForm] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const unitsRes = await unitsService.list();
      setUnits(((unitsRes as any)?.data ?? []) as UnitDb[]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load units");
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch =
        u.unitNo.toLowerCase().includes(search.toLowerCase()) ||
        String((u as any)?.project ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesType = typeFilter === "all" || getUnitDisplayType(u) === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [units, search, statusFilter, typeFilter]);

  const unitStats = useMemo(() => {
    return {
      total: units.length,
      available: units.filter((u) => u.status === "AVAILABLE").length,
      booked: units.filter((u) => u.status === "BOOKED").length,
      sold: units.filter((u) => u.status === "SOLD").length,
    };
  }, [units]);

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 12 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, setPage]);

  return (
    <PageWrapper title="Unit Management" description="Manage property units and inventory." sidebarCollapsed={sidebarCollapsed}
      actions={
        canWriteUnits ? (
          <Button className="w-full sm:w-auto" size="sm" onClick={() => setShowUnitForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Unit
          </Button>
        ) : undefined
      }>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Units" value={unitStats.total} icon={Home} delay={0} />
        <KPICard title="Available" value={unitStats.available} icon={Home} iconColor="text-success" delay={0.1} />
        <KPICard title="Booked" value={unitStats.booked} icon={Home} iconColor="text-warning" delay={0.2} />
        <KPICard title="Sold" value={unitStats.sold} icon={Home} iconColor="text-info" delay={0.3} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search units..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="HOLD">On Hold</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="1 BHK">1 BHK</SelectItem>
            <SelectItem value="2 BHK">2 BHK</SelectItem>
            <SelectItem value="3 BHK">3 BHK</SelectItem>
            <SelectItem value="4 BHK">4 BHK</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg w-full sm:w-auto">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">Loading units...</div>
      ) : paginatedUnits.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No units found.</div>
      ) : (
        <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
          {paginatedUnits.map((unit) => (
            <Card key={unit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={unit.status === "AVAILABLE" ? "default" : unit.status === "BOOKED" ? "secondary" : "outline"}
                  className={unit.status === "AVAILABLE" ? "bg-success/10 text-success border-success/20" : unit.status === "BOOKED" ? "bg-warning/10 text-warning border-warning/20" : ""}>
                  {getStatusLabel(unit.status)}
                </Badge>
                <span className="text-lg font-semibold text-primary">{formatPrice((unit as any)?.price as any)}</span>
              </div>
              <h4 className="font-semibold">{unit.unitNo}</h4>
              <p className="text-sm text-muted-foreground mb-2">{String((unit as any)?.project ?? "-")}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{getUnitDisplayType(unit)}</span>
                <span>•</span>
                <span>{getUnitArea(unit)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{getUnitLocation(unit)}</p>
            </Card>
          ))}
        </div>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      {canWriteUnits && (
        <UnitForm open={showUnitForm} onOpenChange={setShowUnitForm} onSuccess={loadData} />
      )}
    </PageWrapper>
  );
};