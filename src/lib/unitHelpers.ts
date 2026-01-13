// Helper functions for handling different unit types

import type { Unit as MockUnit, ResidentialUnit, CommercialUnit, IndustrialUnit } from '@/data/mockData';
import type { UnitDb } from '@/api/services/units.service';

type Unit = MockUnit | UnitDb;

export const isResidential = (unit: Unit): unit is ResidentialUnit => 
  unit.mainType === 'Residential';

export const isCommercial = (unit: Unit): unit is CommercialUnit => 
  unit.mainType === 'Commercial';

export const isIndustrial = (unit: Unit): unit is IndustrialUnit => 
  unit.mainType === 'Industrial';

export const getUnitDisplayType = (unit: Unit): string => {
  if (isResidential(unit)) {
    const bedrooms = (unit as any)?.bedrooms;
    return Number.isFinite(bedrooms) && Number(bedrooms) > 0 ? `${Number(bedrooms)} BHK` : 'Residential';
  }
  if (isCommercial(unit)) {
    return String((unit as any)?.suitableFor || 'Commercial');
  }
  if (isIndustrial(unit)) {
    return String((unit as any)?.facilityType || 'Industrial');
  }
  return 'Unknown';
};

export const getUnitArea = (unit: Unit): string => {
  if (isResidential(unit)) {
    const carpetArea = (unit as any)?.carpetArea;
    const builtUpArea = (unit as any)?.builtUpArea;
    const area = Number.isFinite(carpetArea) && Number(carpetArea) > 0 ? Number(carpetArea) : Number.isFinite(builtUpArea) && Number(builtUpArea) > 0 ? Number(builtUpArea) : null;
    return area ? `${area} sq.ft` : 'N/A';
  }
  if (isCommercial(unit)) {
    const carpetArea = (unit as any)?.carpetArea;
    const builtUpArea = (unit as any)?.builtUpArea;
    const area = Number.isFinite(carpetArea) && Number(carpetArea) > 0 ? Number(carpetArea) : Number.isFinite(builtUpArea) && Number(builtUpArea) > 0 ? Number(builtUpArea) : null;
    return area ? `${area} sq.ft` : 'N/A';
  }
  if (isIndustrial(unit)) {
    const totalArea = (unit as any)?.totalArea;
    const area = Number.isFinite(totalArea) && Number(totalArea) > 0 ? Number(totalArea) : null;
    return area ? `${area} sq.ft` : 'N/A';
  }
  return 'N/A';
};

export const getUnitFloor = (unit: Unit): number => {
  if (isResidential(unit)) {
    const n = (unit as any)?.floorNumber;
    return Number.isFinite(n) ? Number(n) : 0;
  }
  if (isCommercial(unit)) {
    const n = (unit as any)?.floorNumber;
    return Number.isFinite(n) ? Number(n) : 0;
  }
  return 0;
};

export const getUnitTower = (unit: Unit): string => {
  if (isResidential(unit)) {
    return String((unit as any)?.towerName || '-');
  }
  return '-';
};

export const getUnitLocation = (unit: Unit): string => {
  if (isResidential(unit)) {
    const tower = (unit as any)?.towerName;
    const floor = (unit as any)?.floorNumber;
    const hasTower = typeof tower === 'string' && tower.trim().length > 0;
    const hasFloor = Number.isFinite(floor);
    if (hasTower && hasFloor) return `${tower}, Floor ${Number(floor)}`;
    if (hasTower) return String(tower);
    if (hasFloor) return `Floor ${Number(floor)}`;
    return '-';
  }
  if (isCommercial(unit)) {
    const floor = (unit as any)?.floorNumber;
    return Number.isFinite(floor) ? `Floor ${Number(floor)}` : '-';
  }
  if (isIndustrial(unit)) {
    return String((unit as any)?.roadAccess || '-');
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
