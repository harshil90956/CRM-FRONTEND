import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, Search, MapPin, Home, Heart } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Project, Unit } from "@/data/mockData";
import { httpClient } from "@/api";
import { formatPrice, getStatusStyle, getUnitArea, getUnitDisplayType, getUnitLocation, isCommercial, isIndustrial, isResidential } from "@/lib/unitHelpers";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const AgentPropertiesPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsDialogOpen, setUnitsDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const loadData = async () => {
    const [projectsRes, unitsRes] = await Promise.all([
      httpClient.get<Project[]>('/projects'),
      httpClient.get<Unit[]>('/units'),
    ]);

    setProjects((((projectsRes as any)?.data ?? []) as Project[]));
    setUnits((((unitsRes as any)?.data ?? []) as Unit[]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase());
      const matchesProject = projectFilter === "all" || p.name === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [projects, projectFilter, search]);

  const { page: projectsPage, setPage: setProjectsPage, totalPages: totalProjectsPages, pageItems: paginatedProjects } = useClientPagination(filteredProjects, { pageSize: 6 });

  useEffect(() => {
    setProjectsPage(1);
  }, [search, projectFilter, setProjectsPage]);

  const availableUnits = useMemo(() => {
    return units.filter(u => u.status === 'AVAILABLE');
  }, [units]);

  const { page: unitsPage, setPage: setUnitsPage, totalPages: totalUnitsPages, pageItems: paginatedAvailableUnits } = useClientPagination(availableUnits, { pageSize: 8 });

  const projectUnits = useMemo(() => {
    if (!selectedProject) return [];
    return units.filter((u) => u.projectId === selectedProject.id);
  }, [selectedProject, units]);

  const handleOpenProjectUnits = (project: Project) => {
    setSelectedProject(project);
    setUnitsDialogOpen(true);
  };

  const handleOpenUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitDialogOpen(true);
    setUnitsDialogOpen(false);
  };

  return (
    <PageWrapper title="Properties" description="Browse available properties to share with leads." sidebarCollapsed={sidebarCollapsed}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search properties..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <h3 className="text-lg font-semibold mb-4">Projects</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {paginatedProjects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-muted relative flex items-center justify-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30" />
              <Badge className="absolute top-3 left-3">{project.status}</Badge>
            </div>
            <div className="p-5">
              <h4 className="font-semibold text-lg mb-1">{project.name}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5" />{project.location}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2 bg-muted rounded"><p className="text-lg font-semibold text-success">{project.availableUnits}</p><p className="text-xs text-muted-foreground">Available</p></div>
                <div className="p-2 bg-muted rounded"><p className="text-lg font-semibold text-warning">{project.bookedUnits}</p><p className="text-xs text-muted-foreground">Booked</p></div>
                <div className="p-2 bg-muted rounded"><p className="text-lg font-semibold text-info">{project.soldUnits}</p><p className="text-xs text-muted-foreground">Sold</p></div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Price Range: {project.priceRange}</p>
              <Button className="w-full" onClick={() => handleOpenProjectUnits(project)}>View Units</Button>
            </div>
          </Card>
        ))}
      </div>

      <PaginationBar page={projectsPage} totalPages={totalProjectsPages} onPageChange={setProjectsPage} className="px-0" />

      <h3 className="text-lg font-semibold mb-4">Available Units</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paginatedAvailableUnits.map((unit) => (
          <Card key={unit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenUnit(unit)}>
            <div className="flex items-start justify-between mb-3">
              <Badge className={getStatusStyle(unit.status)}>{unit.status}</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <Heart className="w-4 h-4" />
              </Button>
            </div>
            <h4 className="font-semibold">{unit.unitNo}</h4>
            <p className="text-sm text-muted-foreground mb-2">{unit.project}</p>
            <div className="space-y-1 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2"><Home className="w-3.5 h-3.5" />{getUnitDisplayType(unit)} • {getUnitArea(unit)}</div>
              <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{getUnitLocation(unit)}</div>
            </div>
            <p className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</p>
          </Card>
        ))}
      </div>

      <PaginationBar page={unitsPage} totalPages={totalUnitsPages} onPageChange={setUnitsPage} className="px-0" />

      <Dialog open={unitsDialogOpen} onOpenChange={setUnitsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Units</DialogTitle>
            <DialogDescription>
              {selectedProject ? `${selectedProject.name} • ${selectedProject.location}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-auto pr-2">
            {projectUnits.length === 0 ? (
              <Card className="p-6 md:col-span-2 text-center">
                <p className="text-muted-foreground">No units found for this project.</p>
              </Card>
            ) : (
              projectUnits.map((u) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.unitNo}</p>
                      <p className="text-sm text-muted-foreground truncate">{getUnitDisplayType(u)} • {getUnitArea(u)}</p>
                      <p className="text-sm text-muted-foreground truncate">{getUnitLocation(u)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusStyle(u.status)}>{u.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleOpenUnit(u)}>
                        View Unit
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-primary">{formatPrice(u.price)}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unit Details</DialogTitle>
            <DialogDescription>
              {selectedUnit ? `${selectedUnit.project} • ${selectedUnit.unitNo}` : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedUnit ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium"><Badge className={getStatusStyle(selectedUnit.status)}>{selectedUnit.status}</Badge></p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary">{formatPrice(selectedUnit.price)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{getUnitDisplayType(selectedUnit)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Area</p>
                  <p className="font-medium">{getUnitArea(selectedUnit)}</p>
                </div>
              </div>

              {isResidential(selectedUnit) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{selectedUnit.bedrooms}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{selectedUnit.bathrooms}</p>
                  </div>
                </div>
              )}

              {isCommercial(selectedUnit) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Suitable For</p>
                    <p className="font-medium">{selectedUnit.suitableFor}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Frontage</p>
                    <p className="font-medium">{selectedUnit.frontage}</p>
                  </div>
                </div>
              )}

              {isIndustrial(selectedUnit) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Facility Type</p>
                    <p className="font-medium">{selectedUnit.facilityType}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Clear Height</p>
                    <p className="font-medium">{selectedUnit.clearHeight}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};