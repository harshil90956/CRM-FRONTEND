import { useState, useEffect } from "react";
import { Home } from "lucide-react";
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
import { toast } from "sonner";
import { httpClient } from "@/api";

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  initialUnit?: any;
}

const initialUnit = {
  unitNo: "",
  project: "",
  towerName: "",
  floorNumber: 0,
  price: "",
  status: "AVAILABLE",
  // Residential fields
  bedrooms: 0,
  bathrooms: 0,
  // Commercial fields
  carpetArea: "",
  builtUpArea: "",
  totalArea: "",
};

const parseNumber = (value: string): number => {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const lower = raw.toLowerCase();
  const cleaned = lower.replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;

  // Support shorthand pricing inputs like 85L / 1.2Cr
  if (lower.includes("cr")) return Math.round(parsed * 10000000);
  if (lower.includes("lac") || lower.includes("lakh") || /\bl\b/.test(lower) || lower.endsWith("l")) return Math.round(parsed * 100000);

  return parsed;
};

export const UnitForm = ({ open, onOpenChange, onSuccess, mode = "create", initialUnit: initialUnitProp }: UnitFormProps) => {
  const [unit, setUnit] = useState(initialUnit);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadProjects = async () => {
      try {
        const res = await httpClient.get<any[]>("/projects");
        setProjects(((res as any)?.data ?? []) as any[]);
      } catch (e) {
        setProjects([]);
      }
    };

    loadProjects();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUnitProp) {
      setUnit({
        ...initialUnit,
        ...initialUnitProp,
        price: typeof initialUnitProp.price === "number" ? String(initialUnitProp.price) : (initialUnitProp.price ?? ""),
        carpetArea: initialUnitProp.carpetArea !== undefined && initialUnitProp.carpetArea !== null ? String(initialUnitProp.carpetArea) : "",
        builtUpArea: initialUnitProp.builtUpArea !== undefined && initialUnitProp.builtUpArea !== null ? String(initialUnitProp.builtUpArea) : "",
        totalArea: initialUnitProp.totalArea !== undefined && initialUnitProp.totalArea !== null ? String(initialUnitProp.totalArea) : "",
      });
      return;
    }
    setUnit(initialUnit);
  }, [open, mode, initialUnitProp]);

  const selectedProject = projects.find((p) => p.name === unit.project);
  const projectType = selectedProject?.mainType || initialUnitProp?.mainType || "Residential";

  const handleSubmit = async () => {
    if (!unit.unitNo || !unit.project) {
      toast.error("Please fill in required fields");
      return;
    }

    if (!unit.status) {
      toast.error("Please select a status");
      return;
    }

    setIsLoading(true);
    try {
      const parsedPrice = parseNumber(unit.price);

      const carpetArea = parseNumber((unit as any).carpetArea);
      const builtUpArea = parseNumber((unit as any).builtUpArea);
      const totalArea = parseNumber((unit as any).totalArea);

      const unitData: any = {
        unitNo: unit.unitNo,
        projectId: selectedProject?.id,
        project: unit.project,
        mainType: projectType,
        price: parsedPrice,
        status: unit.status,
      };

      if (projectType === "Residential") {
        if (carpetArea <= 0 && builtUpArea <= 0 && totalArea <= 0) {
          toast.error("Please enter area");
          return;
        }
        unitData.bedrooms = unit.bedrooms;
        unitData.bathrooms = unit.bathrooms;
        unitData.carpetArea = carpetArea || builtUpArea || totalArea;
        unitData.builtUpArea = builtUpArea || carpetArea || totalArea;
        unitData.totalArea = totalArea || builtUpArea || carpetArea;
        unitData.floorNumber = unit.floorNumber;
        unitData.towerName = unit.towerName;
        unitData.facing = initialUnitProp?.facing || "East";
        unitData.hasBalcony = initialUnitProp?.hasBalcony ?? true;
        unitData.parkingCount = initialUnitProp?.parkingCount ?? 1;
        const divisor = unitData.carpetArea || unitData.builtUpArea || unitData.totalArea || 0;
        unitData.pricePerSqft = divisor > 0 ? Math.round(parsedPrice / divisor) : 0;
      }

      if (projectType === "Commercial") {
        if (carpetArea <= 0 && builtUpArea <= 0) {
          toast.error("Please enter area");
          return;
        }
        unitData.carpetArea = carpetArea || builtUpArea;
        unitData.builtUpArea = builtUpArea || carpetArea;
        unitData.totalArea = totalArea || unitData.builtUpArea || unitData.carpetArea;
        unitData.frontage = initialUnitProp?.frontage ?? 0;
        unitData.floorNumber = unit.floorNumber;
        unitData.suitableFor = (initialUnitProp?.suitableFor || "Office") as any;
        unitData.cornerUnit = initialUnitProp?.cornerUnit ?? false;
        unitData.washroomAvailable = initialUnitProp?.washroomAvailable ?? true;
        unitData.maintenanceCharges = initialUnitProp?.maintenanceCharges ?? 0;
      }

      if (projectType === "Industrial") {
        const effectiveTotalArea = totalArea || builtUpArea || carpetArea;
        if (effectiveTotalArea <= 0) {
          toast.error("Please enter total area");
          return;
        }
        unitData.totalArea = effectiveTotalArea;
        unitData.clearHeight = initialUnitProp?.clearHeight ?? 0;
        unitData.facilityType = (initialUnitProp?.facilityType || "Warehouse") as any;
        unitData.powerLoad = initialUnitProp?.powerLoad ?? 0;
        unitData.dockDoors = initialUnitProp?.dockDoors ?? 0;
        unitData.parkingSpace = initialUnitProp?.parkingSpace ?? 0;
        unitData.roadAccess = initialUnitProp?.roadAccess || "N/A";
        unitData.fireNOC = initialUnitProp?.fireNOC ?? true;
      }

      if (mode === "edit" && initialUnitProp?.id) {
        await httpClient.patch(`/units/${initialUnitProp.id}`, unitData);
        toast.success(`Unit "${unit.unitNo}" updated successfully`);
      } else {
        await httpClient.post("/units", unitData);
        toast.success(`Unit "${unit.unitNo}" created successfully`);
      }
      setUnit(initialUnit);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(mode === "edit" ? "Failed to update unit" : "Failed to create unit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            {mode === "edit" ? "Edit Unit" : "Add New Unit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update unit details." : "Create a new unit within a project."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitNo">Unit Number *</Label>
              <Input
                id="unitNo"
                placeholder="e.g., A-101"
                value={unit.unitNo}
                onChange={(e) => setUnit({ ...unit, unitNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={unit.project}
                onValueChange={(v) => setUnit({ ...unit, project: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} ({p.mainType || "Residential"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tower">Tower/Block</Label>
              <Input
                id="tower"
                placeholder="e.g., Tower A"
                value={unit.towerName}
                onChange={(e) => setUnit({ ...unit, towerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                placeholder="0"
                value={unit.floorNumber || ""}
                onChange={(e) => setUnit({ ...unit, floorNumber: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Residential Fields */}
          {projectType === "Residential" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Select
                  value={(() => {
                    const v = Number((unit as any).bedrooms);
                    return Number.isFinite(v) && v > 0 ? String(v) : "";
                  })()}
                  onValueChange={(v) => setUnit({ ...unit, bedrooms: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} BHK
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Select
                  value={(() => {
                    const v = Number((unit as any).bathrooms);
                    return Number.isFinite(v) && v > 0 ? String(v) : "";
                  })()}
                  onValueChange={(v) => setUnit({ ...unit, bathrooms: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Commercial Fields */}
          {projectType === "Commercial" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carpetArea">Carpet Area (sq.ft)</Label>
                <Input
                  id="carpetArea"
                  placeholder="e.g., 1200"
                  value={(unit as any).carpetArea}
                  onChange={(e) => setUnit({ ...unit, carpetArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="builtUpArea">Built-up Area (sq.ft)</Label>
                <Input
                  id="builtUpArea"
                  placeholder="e.g., 1500"
                  value={(unit as any).builtUpArea}
                  onChange={(e) => setUnit({ ...unit, builtUpArea: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Industrial Fields */}
          {projectType === "Industrial" && (
            <div className="space-y-2">
              <Label htmlFor="totalArea">Total Area (sq.ft)</Label>
              <Input
                id="totalArea"
                placeholder="e.g., 5000"
                value={(unit as any).totalArea}
                onChange={(e) => setUnit({ ...unit, totalArea: e.target.value })}
              />
            </div>
          )}

          {projectType === "Residential" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carpetArea">Carpet Area (sq.ft)</Label>
                <Input
                  id="carpetArea"
                  placeholder="e.g., 1050"
                  value={(unit as any).carpetArea}
                  onChange={(e) => setUnit({ ...unit, carpetArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="builtUpArea">Built-up Area (sq.ft)</Label>
                <Input
                  id="builtUpArea"
                  placeholder="e.g., 1250"
                  value={(unit as any).builtUpArea}
                  onChange={(e) => setUnit({ ...unit, builtUpArea: e.target.value })}
                />
              </div>
            </div>
          )}

          {projectType !== "Industrial" && (
            <div className="space-y-2">
              <Label htmlFor="totalArea">Total Area (sq.ft)</Label>
              <Input
                id="totalArea"
                placeholder="e.g., 1400"
                value={(unit as any).totalArea}
                onChange={(e) => setUnit({ ...unit, totalArea: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              placeholder="e.g., ₹85L"
              value={unit.price}
              onChange={(e) => setUnit({ ...unit, price: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={unit.status}
              onValueChange={(v) => setUnit({ ...unit, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="HOLD">On Hold</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (mode === "edit" ? "Saving..." : "Creating...") : (mode === "edit" ? "Save Changes" : "Create Unit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
