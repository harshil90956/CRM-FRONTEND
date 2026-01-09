// Helper functions for handling different unit types

import { Unit, ResidentialUnit, CommercialUnit, IndustrialUnit } from '@/data/mockData';

export const isResidential = (unit: Unit): unit is ResidentialUnit => 
  unit.mainType === 'Residential';

export const isCommercial = (unit: Unit): unit is CommercialUnit => 
  unit.mainType === 'Commercial';

export const isIndustrial = (unit: Unit): unit is IndustrialUnit => 
  unit.mainType === 'Industrial';

export const getUnitDisplayType = (unit: Unit): string => {
  if (isResidential(unit)) {
    return `${unit.bedrooms} BHK`;
  }
  if (isCommercial(unit)) {
    return unit.suitableFor;
  }
  if (isIndustrial(unit)) {
    return unit.facilityType;
  }
  return 'Unknown';
};

export const getUnitArea = (unit: Unit): string => {
  if (isResidential(unit)) {
    return `${unit.carpetArea} sq.ft`;
  }
  if (isCommercial(unit)) {
    return `${unit.carpetArea} sq.ft`;
  }
  if (isIndustrial(unit)) {
    return `${unit.totalArea} sq.ft`;
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
  if (isResidential(unit)) {
    return `${unit.towerName}, Floor ${unit.floorNumber}`;
  }
  if (isCommercial(unit)) {
    return `Floor ${unit.floorNumber}`;
  }
  if (isIndustrial(unit)) {
    return unit.roadAccess;
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
