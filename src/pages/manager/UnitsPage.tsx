import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Home, Search, Grid, List } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { unitsService, type ManagerUnit, type UnitStatus, type UnitType } from "@/api/services/units.service";

export const ManagerUnitsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<'all' | UnitStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | UnitType>('all');

  const formatPriceInr = (price: number) => {
    const value = Number(price) || 0;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const statusLabel = (status: UnitStatus) => {
    const map: Record<UnitStatus, string> = {
      AVAILABLE: 'Available',
      BOOKED: 'Booked',
      SOLD: 'Sold',
      ON_HOLD: 'On Hold',
    };
    return map[status] || status;
  };

  const statusBadgeClass = (status: UnitStatus) => {
    const map: Record<UnitStatus, string> = {
      AVAILABLE: 'bg-success/10 text-success border-success/20',
      BOOKED: 'bg-warning/10 text-warning border-warning/20',
      SOLD: 'bg-muted text-muted-foreground border-border',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800',
    };
    return map[status] || 'bg-muted text-muted-foreground border-border';
  };

  const { data: unitsData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['managerUnits'],
    queryFn: () => unitsService.listManagerUnits(),
    staleTime: 0,
  });

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unitsData.filter((u: ManagerUnit) => {
      const matchesSearch =
        !q ||
        u.unitNumber.toLowerCase().includes(q) ||
        u.project.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesType = typeFilter === 'all' || u.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [unitsData, search, statusFilter, typeFilter]);

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 12 });

  const kpis = useMemo(() => {
    const total = unitsData.length;
    const available = unitsData.filter((u) => u.status === 'AVAILABLE').length;
    const booked = unitsData.filter((u) => u.status === 'BOOKED').length;
    const sold = unitsData.filter((u) => u.status === 'SOLD').length;
    return { total, available, booked, sold };
  }, [unitsData]);

  return (
    <PageWrapper title="Unit Management" description="Manage property units and inventory." sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button
          className="w-full sm:w-auto"
          size="sm"
          variant="secondary"
          disabled
        >
          Add Unit
        </Button>
      }>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Units" value={kpis.total} icon={Home} delay={0} />
        <KPICard title="Available" value={kpis.available} icon={Home} iconColor="text-success" delay={0.1} />
        <KPICard title="Booked" value={kpis.booked} icon={Home} iconColor="text-warning" delay={0.2} />
        <KPICard title="Sold" value={kpis.sold} icon={Home} iconColor="text-info" delay={0.3} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search units..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-lg w-full sm:w-auto">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading units...</div>
      ) : isError ? (
        <div className="space-y-3">
          <div className="text-sm text-destructive">Failed to load units.</div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="text-sm text-muted-foreground">No units found.</div>
      ) : (
        <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
          {paginatedUnits.map((unit) => (
            <Card key={unit.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className={statusBadgeClass(unit.status)}>
                  {statusLabel(unit.status)}
                </Badge>
                <span className="text-lg font-semibold text-primary">{formatPriceInr(unit.price)}</span>
              </div>

              <h4 className="font-semibold">{unit.unitNumber}</h4>
              <p className="text-sm text-muted-foreground mb-2">{unit.project.name}</p>

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{unit.type === 'RESIDENTIAL' ? (unit.bhk ? `${unit.bhk} BHK` : 'Residential') : 'Commercial'}</span>
                <span>•</span>
                <span>{unit.sizeSqFt ? `${unit.sizeSqFt} sq.ft` : 'N/A'}</span>
              </div>

              {(unit.tower || unit.floor !== undefined) ? (
                <p className="text-xs text-muted-foreground mt-2">
                  {unit.tower ? `${unit.tower}` : ''}{unit.tower && unit.floor !== undefined ? ', ' : ''}{unit.floor !== undefined ? `Floor ${unit.floor}` : ''}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
    </PageWrapper>
  );
};