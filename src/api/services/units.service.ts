import { httpClient } from '../httpClient';

export type UnitDb = {
  id: string;
  unitNo: string;
  status: string;
  projectId?: string;
  project?: string;
  mainType?: string;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorNumber?: number | null;
  towerName?: string | null;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
};

export const unitsService = {
  list: async () => httpClient.get<UnitDb[]>('/units'),
};
