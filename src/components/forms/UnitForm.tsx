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
import { mockApi } from "@/lib/mockApi";
import { projects as defaultProjects } from "@/data/mockData";

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
  area: "",
  price: "",
  status: "AVAILABLE",
  // Residential fields
  bedrooms: 0,
  bathrooms: 0,
  // Commercial fields
  carpetArea: "",
  builtUpArea: "",
  // Industrial fields
  plotSize: "",
  covered: false,
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
    const stored = mockApi.getAll("projects");
    setProjects(stored.length > 0 ? stored : defaultProjects);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUnitProp) {
      const areaFromUnit =
        initialUnitProp.mainType === "Industrial"
          ? initialUnitProp.totalArea
          : initialUnitProp.carpetArea;

      setUnit({
        ...initialUnit,
        ...initialUnitProp,
        price: typeof initialUnitProp.price === "number" ? String(initialUnitProp.price) : (initialUnitProp.price ?? ""),
        area: areaFromUnit ? String(areaFromUnit) : (initialUnitProp.area ?? ""),
        builtUpArea: initialUnitProp.builtUpArea ? String(initialUnitProp.builtUpArea) : (initialUnitProp.builtUpArea ?? ""),
      });
      return;
    }
    setUnit(initialUnit);
  }, [open, mode, initialUnitProp]);

  const selectedProject = projects.find((p) => p.name === unit.project);
  const projectType = selectedProject?.mainType || "Residential";

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
      const parsedArea = parseNumber(unit.area);
      const parsedPrice = parseNumber(unit.price);

      const unitData: any = {
        unitNo: unit.unitNo,
        projectId: selectedProject?.id,
        project: unit.project,
        mainType: projectType,
        price: parsedPrice,
        status: unit.status,
      };

      if (projectType === "Residential") {
        unitData.bedrooms = unit.bedrooms;
        unitData.bathrooms = unit.bathrooms;
        unitData.carpetArea = parsedArea;
        unitData.builtUpArea = parseNumber(unit.builtUpArea) || parsedArea;
        unitData.floorNumber = unit.floorNumber;
        unitData.towerName = unit.towerName;
        unitData.facing = initialUnitProp?.facing || "East";
        unitData.hasBalcony = initialUnitProp?.hasBalcony ?? true;
        unitData.parkingCount = initialUnitProp?.parkingCount ?? 1;
        unitData.pricePerSqft = parsedArea > 0 ? Math.round(parsedPrice / parsedArea) : 0;
      }

      if (projectType === "Commercial") {
        unitData.carpetArea = parsedArea;
        unitData.builtUpArea = parseNumber(unit.builtUpArea) || parsedArea;
        unitData.frontage = initialUnitProp?.frontage ?? 0;
        unitData.floorNumber = unit.floorNumber;
        unitData.suitableFor = (initialUnitProp?.suitableFor || "Office") as any;
        unitData.cornerUnit = initialUnitProp?.cornerUnit ?? false;
        unitData.washroomAvailable = initialUnitProp?.washroomAvailable ?? true;
        unitData.maintenanceCharges = initialUnitProp?.maintenanceCharges ?? 0;
      }

      if (projectType === "Industrial") {
        unitData.totalArea = parsedArea;
        unitData.clearHeight = initialUnitProp?.clearHeight ?? 0;
        unitData.facilityType = (initialUnitProp?.facilityType || "Warehouse") as any;
        unitData.powerLoad = initialUnitProp?.powerLoad ?? 0;
        unitData.dockDoors = initialUnitProp?.dockDoors ?? 0;
        unitData.parkingSpace = initialUnitProp?.parkingSpace ?? 0;
        unitData.roadAccess = initialUnitProp?.roadAccess || "N/A";
        unitData.fireNOC = initialUnitProp?.fireNOC ?? true;
      }

      if (mode === "edit" && initialUnitProp?.id) {
        await mockApi.patch("/units", initialUnitProp.id, unitData);
        toast.success(`Unit "${unit.unitNo}" updated successfully`);
      } else {
        await mockApi.post("/units", unitData);
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
                  value={unit.bedrooms.toString()}
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
                  value={unit.bathrooms.toString()}
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
                  value={unit.carpetArea}
                  onChange={(e) => setUnit({ ...unit, carpetArea: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="builtUpArea">Built-up Area (sq.ft)</Label>
                <Input
                  id="builtUpArea"
                  placeholder="e.g., 1500"
                  value={unit.builtUpArea}
                  onChange={(e) => setUnit({ ...unit, builtUpArea: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Industrial Fields */}
          {projectType === "Industrial" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plotSize">Plot Size (sq.ft)</Label>
                <Input
                  id="plotSize"
                  placeholder="e.g., 5000"
                  value={unit.plotSize}
                  onChange={(e) => setUnit({ ...unit, plotSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Covered</Label>
                <Select
                  value={unit.covered ? "yes" : "no"}
                  onValueChange={(v) => setUnit({ ...unit, covered: v === "yes" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Total Area</Label>
              <Input
                id="area"
                placeholder="e.g., 1250 sq.ft"
                value={unit.area}
                onChange={(e) => setUnit({ ...unit, area: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                placeholder="e.g., ₹85L"
                value={unit.price}
                onChange={(e) => setUnit({ ...unit, price: e.target.value })}
              />
            </div>
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
