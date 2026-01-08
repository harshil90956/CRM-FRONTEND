import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Home, Search, Plus, Grid, List } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { units, projects } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUnitDisplayType, getUnitArea, getUnitLocation, formatPrice, getStatusStyle, getStatusLabel } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const ManagerUnitsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({ unitNo: "", project: "", tower: "", floor: "", type: "2 BHK", area: "", price: "" });

  const filteredUnits = units.filter(u => {
    const matchesSearch = u.unitNo.toLowerCase().includes(search.toLowerCase()) || u.project.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const matchesType = typeFilter === "all" || getUnitDisplayType(u) === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const { page, setPage, totalPages, pageItems: paginatedUnits } = useClientPagination(filteredUnits, { pageSize: 12 });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, setPage]);

  const handleAddUnit = () => {
    toast.success(`Unit ${newUnit.unitNo} added successfully`);
    setIsAddOpen(false);
    setNewUnit({ unitNo: "", project: "", tower: "", floor: "", type: "2 BHK", area: "", price: "" });
  };

  return (
    <PageWrapper title="Unit Management" description="Manage property units and inventory." sidebarCollapsed={sidebarCollapsed}
      actions={<Button className="w-full sm:w-auto" size="sm" onClick={() => setIsAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Unit</Button>}>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Units" value={units.length} icon={Home} delay={0} />
        <KPICard title="Available" value={units.filter(u => u.status === 'AVAILABLE').length} icon={Home} iconColor="text-success" delay={0.1} />
        <KPICard title="Booked" value={units.filter(u => u.status === 'BOOKED').length} icon={Home} iconColor="text-warning" delay={0.2} />
        <KPICard title="Sold" value={units.filter(u => u.status === 'SOLD').length} icon={Home} iconColor="text-info" delay={0.3} />
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

      <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
        {paginatedUnits.map((unit) => (
          <Card key={unit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <Badge variant={unit.status === "AVAILABLE" ? "default" : unit.status === "BOOKED" ? "secondary" : "outline"}
                className={unit.status === "AVAILABLE" ? "bg-success/10 text-success border-success/20" : unit.status === "BOOKED" ? "bg-warning/10 text-warning border-warning/20" : ""}>
                {getStatusLabel(unit.status)}
              </Badge>
              <span className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</span>
            </div>
            <h4 className="font-semibold">{unit.unitNo}</h4>
            <p className="text-sm text-muted-foreground mb-2">{unit.project}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{getUnitDisplayType(unit)}</span>
              <span>•</span>
              <span>{getUnitArea(unit)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{getUnitLocation(unit)}</p>
          </Card>
        ))}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Unit</DialogTitle><DialogDescription>Add a new unit to the inventory.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit Number *</Label><Input placeholder="A-101" value={newUnit.unitNo} onChange={(e) => setNewUnit({...newUnit, unitNo: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Project *</Label>
                <Select value={newUnit.project} onValueChange={(v) => setNewUnit({...newUnit, project: v})}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tower</Label><Input placeholder="Tower A" value={newUnit.tower} onChange={(e) => setNewUnit({...newUnit, tower: e.target.value})} /></div>
              <div className="space-y-2"><Label>Floor</Label><Input type="number" placeholder="1" value={newUnit.floor} onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={newUnit.type} onValueChange={(v) => setNewUnit({...newUnit, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 BHK">1 BHK</SelectItem>
                    <SelectItem value="2 BHK">2 BHK</SelectItem>
                    <SelectItem value="3 BHK">3 BHK</SelectItem>
                    <SelectItem value="4 BHK">4 BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Area</Label><Input placeholder="1250 sq.ft" value={newUnit.area} onChange={(e) => setNewUnit({...newUnit, area: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Price</Label><Input placeholder="₹85L" value={newUnit.price} onChange={(e) => setNewUnit({...newUnit, price: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleAddUnit}>Add Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};