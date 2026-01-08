import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PropertyMainType } from "@/data/mockData";

interface FilterState {
  search: string;
  mainType: PropertyMainType | 'all';
  status: string;
  project: string;
  // Residential
  bedrooms: string;
  facing: string;
  // Commercial
  suitableFor: string;
  cornerUnit: boolean | null;
  // Industrial
  facilityType: string;
  // Range filters
  priceRange: [number, number];
  areaRange: [number, number];
}

interface PropertyFilterBarProps {
  mainType?: PropertyMainType | 'all';
  projects: { id: string; name: string; mainType: PropertyMainType }[];
  onFilterChange: (filters: Partial<FilterState>) => void;
  showTypeFilter?: boolean;
  className?: string;
}

const defaultFilters: FilterState = {
  search: '',
  mainType: 'all',
  status: 'all',
  project: 'all',
  bedrooms: 'all',
  facing: 'all',
  suitableFor: 'all',
  cornerUnit: null,
  facilityType: 'all',
  priceRange: [0, 100000000],
  areaRange: [0, 50000],
};

export const PropertyFilterBar = ({
  mainType = 'all',
  projects,
  onFilterChange,
  showTypeFilter = true,
  className,
}: PropertyFilterBarProps) => {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, mainType });
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search' && value === '') return false;
    if (key === 'priceRange' || key === 'areaRange') return false;
    if (value === 'all' || value === null) return false;
    return true;
  }).length;

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { ...defaultFilters, mainType: filters.mainType };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const currentType = filters.mainType;

  return (
    <div className={cn("card-elevated p-4 space-y-4", className)}>
      {/* Primary Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by unit number, project..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {showTypeFilter && (
          <Select
            value={filters.mainType}
            onValueChange={(v) => updateFilter('mainType', v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.project}
          onValueChange={(v) => updateFilter('project', v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects
              .filter((p) => currentType === 'all' || p.mainType === currentType)
              .map((p) => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="HOLD">On Hold</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="space-y-4 pt-4 border-t border-border">
          {/* Type-specific filters */}
          {(currentType === 'all' || currentType === 'Residential') && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Residential Filters</h4>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[140px]">
                  <Label className="text-xs">Bedrooms</Label>
                  <Select
                    value={filters.bedrooms}
                    onValueChange={(v) => updateFilter('bedrooms', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1 BHK</SelectItem>
                      <SelectItem value="2">2 BHK</SelectItem>
                      <SelectItem value="3">3 BHK</SelectItem>
                      <SelectItem value="4">4 BHK</SelectItem>
                      <SelectItem value="5">5+ BHK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-[140px]">
                  <Label className="text-xs">Facing</Label>
                  <Select
                    value={filters.facing}
                    onValueChange={(v) => updateFilter('facing', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="East">East</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {(currentType === 'all' || currentType === 'Commercial') && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Commercial Filters</h4>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[160px]">
                  <Label className="text-xs">Suitable For</Label>
                  <Select
                    value={filters.suitableFor}
                    onValueChange={(v) => updateFilter('suitableFor', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Shop">Shop</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Showroom">Showroom</SelectItem>
                      <SelectItem value="Salon">Salon</SelectItem>
                      <SelectItem value="Cafe">Cafe</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="corner-unit"
                    checked={filters.cornerUnit === true}
                    onCheckedChange={(checked) => updateFilter('cornerUnit', checked ? true : null)}
                  />
                  <Label htmlFor="corner-unit" className="text-sm">Corner Unit Only</Label>
                </div>
              </div>
            </div>
          )}

          {(currentType === 'all' || currentType === 'Industrial') && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Industrial Filters</h4>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[160px]">
                  <Label className="text-xs">Facility Type</Label>
                  <Select
                    value={filters.facilityType}
                    onValueChange={(v) => updateFilter('facilityType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Industrial Plot">Industrial Plot</SelectItem>
                      <SelectItem value="Shed">Shed</SelectItem>
                      <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Price Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-xs">Price Range</Label>
              <span className="text-xs text-muted-foreground">
                ₹{(filters.priceRange[0] / 100000).toFixed(0)}L - ₹{(filters.priceRange[1] / 100000).toFixed(0)}L
              </span>
            </div>
            <Slider
              value={filters.priceRange}
              min={0}
              max={100000000}
              step={500000}
              onValueChange={(v) => updateFilter('priceRange', v as [number, number])}
              className="w-full"
            />
          </div>

          {/* Area Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-xs">Area Range</Label>
              <span className="text-xs text-muted-foreground">
                {filters.areaRange[0].toLocaleString()} - {filters.areaRange[1].toLocaleString()} sq.ft
              </span>
            </div>
            <Slider
              value={filters.areaRange}
              min={0}
              max={50000}
              step={100}
              onValueChange={(v) => updateFilter('areaRange', v as [number, number])}
              className="w-full"
            />
          </div>

          {/* Active Filters & Clear */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-wrap gap-2">
                {filters.bedrooms !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.bedrooms} BHK
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('bedrooms', 'all')} />
                  </Badge>
                )}
                {filters.facing !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.facing} Facing
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('facing', 'all')} />
                  </Badge>
                )}
                {filters.suitableFor !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.suitableFor}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('suitableFor', 'all')} />
                  </Badge>
                )}
                {filters.cornerUnit === true && (
                  <Badge variant="secondary" className="gap-1">
                    Corner Unit
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('cornerUnit', null)} />
                  </Badge>
                )}
                {filters.facilityType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.facilityType}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('facilityType', 'all')} />
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
