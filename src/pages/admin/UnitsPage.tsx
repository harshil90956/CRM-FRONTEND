import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Filter, Search, Home, CheckCircle, Clock, Ban, LayoutGrid, List } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { UnitsTable } from "@/components/tables/UnitsTable";
import { UnitForm } from "@/components/forms/UnitForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Unit } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { getUnitDisplayType, getUnitArea, getUnitLocation, formatPrice, getStatusStyle, getStatusLabel } from "@/lib/unitHelpers";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { httpClient } from "@/api";

export const UnitsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showUnitForm, setShowUnitForm] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewUnit, setViewUnit] = useState<Unit | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [unitsRes, projectsRes] = await Promise.all([
        httpClient.get<Unit[]>("/units"),
        httpClient.get<any[]>("/projects"),
      ]);
      setUnits(((unitsRes as any)?.data ?? []) as Unit[]);
      setProjects(((projectsRes as any)?.data ?? []) as any[]);
    } catch (e) {
      toast.error("Failed to load units");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch =
        u.unitNo.toLowerCase().includes(search.toLowerCase()) ||
        u.project.toLowerCase().includes(search.toLowerCase());
      const matchesProject = projectFilter === "all" || u.projectId === projectFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [units, search, projectFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, projectFilter, statusFilter, setPage]);

  const unitStats = useMemo(() => {
    return {
      total: units.length,
      available: units.filter((u) => u.status === "AVAILABLE").length,
      booked: units.filter((u) => u.status === "BOOKED").length,
      sold: units.filter((u) => u.status === "SOLD").length,
    };
  }, [units]);

  const handleView = (unit: Unit) => {
    setViewUnit(unit);
    setViewOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditUnit(unit);
    setEditOpen(true);
  };

  const handleAskDelete = (unit: Unit) => {
    setDeleteUnit(unit);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUnit) return;
    try {
      await httpClient.delete(`/units/${deleteUnit.id}`);
      toast.success(`Unit "${deleteUnit.unitNo}" deleted`);
      setDeleteOpen(false);
      setDeleteUnit(null);
      await loadData();
    } catch (e) {
      toast.error("Failed to delete unit");
    }
  };

  return (
    <PageWrapper
      title="Unit Management"
      description="Manage all property units across your projects."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("table")}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setShowUnitForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Units" value={unitStats.total} icon={Home} delay={0} />
        <KPICard title="Available" value={unitStats.available} icon={CheckCircle} iconColor="text-success" delay={0.1} />
        <KPICard title="Booked" value={unitStats.booked} icon={Clock} iconColor="text-warning" delay={0.2} />
        <KPICard title="Sold" value={unitStats.sold} icon={Ban} iconColor="text-muted-foreground" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="card-elevated p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by unit number..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="HOLD">On Hold</SelectItem>
              <SelectItem value="BOOKED">Booked</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
        </div>
      </motion.div>

      {viewMode === "table" ? (
        <UnitsTable data={paginatedUnits} onView={handleView} onEdit={handleEdit} onDelete={handleAskDelete} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedUnits.map((unit, index) => (
            <motion.div key={unit.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(unit)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{unit.unitNo}</h4>
                    <p className="text-xs text-muted-foreground">{unit.project}</p>
                  </div>
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusStyle(unit.status))}>{getStatusLabel(unit.status)}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{getUnitDisplayType(unit)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-medium">{getUnitArea(unit)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{getUnitLocation(unit)}</span></div>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <UnitForm open={showUnitForm} onOpenChange={setShowUnitForm} onSuccess={loadData} />

      <UnitForm open={editOpen} onOpenChange={setEditOpen} onSuccess={loadData} mode="edit" initialUnit={editUnit} />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Unit Details</DialogTitle>
            <DialogDescription>View unit information.</DialogDescription>
          </DialogHeader>
          {viewUnit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Unit No</p>
                  <p className="font-medium">{viewUnit.unitNo}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusLabel(viewUnit.status)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-muted-foreground">Project</p>
                  <p className="font-medium">{viewUnit.project}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{getUnitDisplayType(viewUnit)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Area</p>
                  <p className="font-medium">{getUnitArea(viewUnit)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{getUnitLocation(viewUnit)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary">{formatPrice(viewUnit.price)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {viewUnit && (
              <Button onClick={() => { setViewOpen(false); handleEdit(viewUnit); }}>Edit</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete unit</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUnit ? `This will permanently delete unit "${deleteUnit.unitNo}".` : "This will permanently delete the selected unit."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};
