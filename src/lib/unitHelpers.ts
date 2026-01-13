// Helper functions for handling different unit types

import { Unit, ResidentialUnit, CommercialUnit, IndustrialUnit } from '@/data/mockData';

 const normalizeMainType = (value: unknown): string => {
   if (typeof value !== 'string') return '';
   const v = value.trim().toLowerCase();
   if (v === 'residential') return 'Residential';
   if (v === 'commercial') return 'Commercial';
   if (v === 'industrial') return 'Industrial';
   return value.trim();
 };

export const isResidential = (unit: Unit): unit is ResidentialUnit => 
  normalizeMainType((unit as any).mainType) === 'Residential';

export const isCommercial = (unit: Unit): unit is CommercialUnit => 
  normalizeMainType((unit as any).mainType) === 'Commercial';

export const isIndustrial = (unit: Unit): unit is IndustrialUnit => 
  normalizeMainType((unit as any).mainType) === 'Industrial';

export const getUnitMainType = (unit: Unit): string => {
  const t = normalizeMainType((unit as any).mainType);
  if (t === 'Residential' || t === 'Commercial' || t === 'Industrial') return t;
  return 'Unknown';
};

export const getUnitDisplayType = (unit: Unit): string => {
  if (isResidential(unit)) {
    const beds = Number((unit as any).bedrooms);
    if (!Number.isFinite(beds) || beds <= 0) return 'Residential';
    return `${beds} BHK`;
  }
  if (isCommercial(unit)) {
    return String((unit as any).suitableFor || 'Commercial');
  }
  if (isIndustrial(unit)) {
    return String((unit as any).facilityType || 'Industrial');
  }
  return 'Unknown';
};

export const getUnitArea = (unit: Unit): string => {
  if (isResidential(unit)) {
    const carpet = Number((unit as any).carpetArea);
    if (Number.isFinite(carpet) && carpet > 0) return `${carpet} sq.ft`;

    const builtUp = Number((unit as any).builtUpArea);
    if (Number.isFinite(builtUp) && builtUp > 0) return `${builtUp} sq.ft`;

    const total = Number((unit as any).totalArea);
    if (Number.isFinite(total) && total > 0) return `${total} sq.ft`;

    return 'N/A';
  }
  if (isCommercial(unit)) {
    const carpet = Number((unit as any).carpetArea);
    if (Number.isFinite(carpet) && carpet > 0) return `${carpet} sq.ft`;

    const builtUp = Number((unit as any).builtUpArea);
    if (Number.isFinite(builtUp) && builtUp > 0) return `${builtUp} sq.ft`;

    return 'N/A';
  }
  if (isIndustrial(unit)) {
    const total = Number((unit as any).totalArea);
    if (Number.isFinite(total) && total > 0) return `${total} sq.ft`;

    const builtUp = Number((unit as any).builtUpArea);
    if (Number.isFinite(builtUp) && builtUp > 0) return `${builtUp} sq.ft`;

    const carpet = Number((unit as any).carpetArea);
    if (Number.isFinite(carpet) && carpet > 0) return `${carpet} sq.ft`;

    return 'N/A';
  }
  return 'N/A';
};

export const getUnitFloor = (unit: Unit): number => {
  if (isResidential(unit)) {
    return unit.floorNumber;
  }
  if (isCommercial(unit)) {
    return unit.floorNumber;
  }
  return 0;
};

export const getUnitTower = (unit: Unit): string => {
  if (isResidential(unit)) {
    return unit.towerName;
  }
  return '-';
};

export const getUnitLocation = (unit: Unit): string => {
  const projectLocation = typeof (unit as any).projectLocation === 'string' ? String((unit as any).projectLocation) : '';
  if (projectLocation.trim()) return projectLocation;

  if (isResidential(unit)) {
    const tower = String((unit as any).towerName || '').trim();
    const floor = Number((unit as any).floorNumber);
    if (!tower && !Number.isFinite(floor)) return '-';
    if (!tower) return `Floor ${Number.isFinite(floor) ? floor : '-'}`;
    return `${tower}, Floor ${Number.isFinite(floor) ? floor : '-'}`;
  }
  if (isCommercial(unit)) {
    const floor = Number((unit as any).floorNumber);
    if (!Number.isFinite(floor)) return '-';
    return `Floor ${floor}`;
  }
  if (isIndustrial(unit)) {
    return String((unit as any).roadAccess || '-');
  }
  return '-';
};

export const formatPrice = (price: number): string => {
  const value = Number(price) || 0;
  return `₹${value.toLocaleString('en-IN')}`;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    AVAILABLE: 'Available',
    HOLD: 'On Hold',
    BOOKED: 'Booked',
    SOLD: 'Sold',
  };
  return labels[status] || status;
};

export const getStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    BOOKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    SOLD: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    // Legacy support
    Available: 'bg-green-100 text-green-800',
    Booked: 'bg-blue-100 text-blue-800',
    Sold: 'bg-gray-100 text-gray-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

export const getLeadStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-purple-100 text-purple-800',
    FOLLOWUP: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    NEGOTIATION: 'bg-orange-100 text-orange-800',
    CONVERTED: 'bg-emerald-100 text-emerald-800',
    LOST: 'bg-red-100 text-red-800',
    // Legacy support
    New: 'bg-blue-100 text-blue-800',
    Contacted: 'bg-purple-100 text-purple-800',
    Qualified: 'bg-green-100 text-green-800',
    Negotiation: 'bg-orange-100 text-orange-800',
    Won: 'bg-emerald-100 text-emerald-800',
    Lost: 'bg-red-100 text-red-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};
