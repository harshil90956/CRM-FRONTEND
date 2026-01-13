import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Building2,
  IndianRupee,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectsService } from "@/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

interface Project {
  id: string;
  name: string;
  location: string;
  mainType?: string;
  status: string;
  totalUnits: number;
  soldUnits: number;
  bookedUnits: number;
  availableUnits: number;
  priceRange: string;
  isClosed?: boolean;
}

const projectTypeOptions = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Industrial', label: 'Industrial' },
];

const getStatusColor = (status: string, isClosed?: boolean) => {
  if (isClosed) return "bg-muted text-muted-foreground";
  const colors: Record<string, string> = {
    Active: "bg-success/10 text-success",
    Launching: "bg-info/10 text-info",
    Completed: "bg-muted text-muted-foreground",
    CLOSED: "bg-destructive/10 text-destructive",
  };
  return colors[status] || "";
};

export const ProjectsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState({ name: "", location: "", mainType: "Residential", status: "Active", priceRange: "" });
  const [newProject, setNewProject] = useState({ name: "", location: "", mainType: "Residential", status: "Active", priceRange: "" });

  useEffect(() => {
    loadProjects();
  }, []);

  const { page, setPage, totalPages, pageItems: paginatedProjects } = useClientPagination(projects, { pageSize: 9 });

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await projectsService.list();
      if (!res.success) {
        throw new Error(res.message || 'Failed to load projects');
      }
      setProjects((res.data || []) as Project[]);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseProject = (project: Project) => {
    setSelectedProject(project);
    setCloseDialogOpen(true);
  };

  const confirmCloseProject = async () => {
    if (!selectedProject) return;
    
    setIsClosing(true);
    try {
      const res = await projectsService.update(selectedProject.id, { isClosed: true, status: 'CLOSED' });
      if (!res.success) {
        throw new Error(res.message || 'Failed to close project');
      }
      toast.success(`${selectedProject.name} has been closed. All units are now unavailable.`);
      await loadProjects();
    } catch (error) {
      toast.error("Failed to close project. Please try again.");
    } finally {
      setIsClosing(false);
      setCloseDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsViewDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name,
      location: project.location,
      mainType: (project as any).mainType || 'Residential',
      status: project.status,
      priceRange: project.priceRange
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await projectsService.update(selectedProject.id, {
        name: editProject.name,
        location: editProject.location,
        mainType: editProject.mainType,
        status: editProject.status,
        priceRange: editProject.priceRange,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update project');
      }
      toast.success(`${editProject.name} has been updated successfully.`);
      await loadProjects();
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      setEditProject({ name: "", location: "", mainType: "Residential", status: "Active", priceRange: "" });
    } catch (error) {
      toast.error("Failed to update project. Please try again.");
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const res = await projectsService.create({
        name: newProject.name,
        location: newProject.location,
        mainType: newProject.mainType,
        status: newProject.status,
        priceRange: newProject.priceRange,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to add project');
      }
      toast.success("Project added successfully");
      await loadProjects();
      setIsAddDialogOpen(false);
      setNewProject({ name: "", location: "", mainType: "Residential", status: "Active", priceRange: "" });
    } catch (error) {
      toast.error("Failed to add project. Please try again.");
    }
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!selectedProject) return;
    
    try {
      const res = await projectsService.delete(selectedProject.id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete project');
      }
      toast.success("Project deleted successfully");
      await loadProjects();
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project. Please try again.");
    }
  };

  return (
    <PageWrapper
      title="Project Management"
      description="Manage all your real estate projects and developments."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project, index) => {
            const safeTotalUnits = project.totalUnits > 0 ? project.totalUnits : 1;
            const soldPercentage = Math.round((project.soldUnits / safeTotalUnits) * 100);
            const bookedPercentage = Math.round((project.bookedUnits / safeTotalUnits) * 100);
            const isClosed = project.isClosed || project.status === 'CLOSED';

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={cn(
                  "overflow-hidden hover:shadow-lg transition-shadow",
                  isClosed && "opacity-60"
                )}>
                  {/* Project Image Placeholder */}
                  <div className="h-40 bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge className={cn("font-medium", getStatusColor(project.status, isClosed))}>
                        {isClosed ? 'CLOSED' : project.status}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover z-50">
                          <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isClosed} onClick={() => handleEditProject(project)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!isClosed && (
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleCloseProject(project)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Close Project
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteProject(project)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-3.5 h-3.5" />
                      {project.location}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold text-foreground">
                          {project.totalUnits}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-2 bg-success/5 rounded-lg">
                        <p className="text-lg font-semibold text-success">
                          {isClosed ? 0 : project.availableUnits}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="text-center p-2 bg-primary/5 rounded-lg">
                        <p className="text-lg font-semibold text-primary">
                          {project.soldUnits}
                        </p>
                        <p className="text-xs text-muted-foreground">Sold</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Sales Progress</span>
                        <span className="font-medium">
                          {soldPercentage + bookedPercentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${soldPercentage + bookedPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Price Range & Close Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {project.priceRange}
                      </div>
                      {!isClosed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseProject(project)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />

      {/* Close Project Confirmation Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Close Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close <strong>{selectedProject?.name}</strong>? 
              This will mark all units as unavailable and prevent new bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 my-4">
            <p className="text-sm text-warning-foreground">
              <strong>Warning:</strong> This action cannot be easily undone. 
              All {selectedProject?.availableUnits || 0} available units will be marked as closed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCloseProject}
              disabled={isClosing}
            >
              {isClosing ? "Closing..." : "Confirm Close Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>View complete information about this project.</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                  <p className="font-semibold">{selectedProject.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-semibold">{selectedProject.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={cn("font-medium", getStatusColor(selectedProject.status, selectedProject.isClosed))}>
                    {selectedProject.isClosed ? 'CLOSED' : selectedProject.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price Range</p>
                  <p className="font-semibold">{selectedProject.priceRange}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Units</p>
                  <p className="font-semibold">{selectedProject.totalUnits}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Units</p>
                  <p className="font-semibold">{selectedProject.isClosed ? 0 : selectedProject.availableUnits}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sold Units</p>
                  <p className="font-semibold">{selectedProject.soldUnits}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Booked Units</p>
                  <p className="font-semibold">{selectedProject.bookedUnits}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="Enter project name" value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="Enter location" value={editProject.location} onChange={(e) => setEditProject({ ...editProject, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select value={editProject.mainType} onValueChange={(v) => setEditProject({ ...editProject, mainType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projectTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editProject.status} onValueChange={(v) => setEditProject({ ...editProject, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Launching">Launching</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Units</Label>
              <Input type="number" placeholder="Derived from Units" value={selectedProject?.totalUnits ?? 0} disabled />
            </div>
            <div className="space-y-2">
              <Label>Price Range</Label>
              <Input placeholder="e.g., ₹50L - ₹1Cr" value={editProject.priceRange} onChange={(e) => setEditProject({ ...editProject, priceRange: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProject}>Update Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>Create a new real estate project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="Enter project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="Enter location" value={newProject.location} onChange={(e) => setNewProject({ ...newProject, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select value={newProject.mainType} onValueChange={(v) => setNewProject({ ...newProject, mainType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projectTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newProject.status} onValueChange={(v) => setNewProject({ ...newProject, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Launching">Launching</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Units</Label>
              <Input type="number" placeholder="Derived from Units" value={0} disabled />
            </div>
            <div className="space-y-2">
              <Label>Price Range</Label>
              <Input placeholder="e.g., ₹50L - ₹1Cr" value={newProject.priceRange} onChange={(e) => setNewProject({ ...newProject, priceRange: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProject}>Add Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProject?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProject}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
