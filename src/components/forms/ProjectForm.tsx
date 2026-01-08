import { useState } from "react";
import { Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { mockApi } from "@/lib/mockApi";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const projectTypes = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
];

const initialProject = {
  name: "",
  location: "",
  mainType: "Residential",
  subType: "",
  totalUnits: 0,
  priceRange: "",
  description: "",
  status: "Launching",
};

export const ProjectForm = ({ open, onOpenChange, onSuccess }: ProjectFormProps) => {
  const [project, setProject] = useState(initialProject);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!project.name || !project.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await mockApi.post("/projects", {
        ...project,
        availableUnits: project.totalUnits,
        bookedUnits: 0,
        soldUnits: 0,
      });
      toast.success(`Project "${project.name}" created successfully`);
      setProject(initialProject);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Add New Project
          </DialogTitle>
          <DialogDescription>
            Create a new real estate project with its details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Green Valley"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Whitefield, Bangalore"
                value={project.location}
                onChange={(e) => setProject({ ...project, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select
                value={project.mainType}
                onValueChange={(v) => setProject({ ...project, mainType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subType">Sub Type</Label>
              <Input
                id="subType"
                placeholder="e.g., Apartments, Villas"
                value={project.subType}
                onChange={(e) => setProject({ ...project, subType: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input
                id="totalUnits"
                type="number"
                placeholder="0"
                value={project.totalUnits || ""}
                onChange={(e) =>
                  setProject({ ...project, totalUnits: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Input
                id="priceRange"
                placeholder="e.g., ₹85L - ₹1.5Cr"
                value={project.priceRange}
                onChange={(e) => setProject({ ...project, priceRange: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={project.status}
              onValueChange={(v) => setProject({ ...project, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Launching">Launching</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project description..."
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
