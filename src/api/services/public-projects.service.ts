import { httpClient } from '../httpClient';

export type PublicProjectCard = {
  id: string;
  name: string;
  location: string;
  mainType: string;
  startingPrice: number;
  availableUnitsCount: number;
  thumbnail: string | null;
};

export type PublicUnit = {
  id: string;
  projectId: string;
  tenantId?: string;
  unitNumber: string;
  price: number;
  sizeSqFt: number;
  bhk?: number;
  floor?: number;
  tower?: string;
  type: string;
};

export const publicProjectsService = {
  // GLOBAL PUBLIC MODE: Read-only catalog across all tenants.
  globalList: async () => {
    return httpClient.get<PublicProjectCard[]>(`/public/global/projects`);
  },
  globalGet: async (id: string) => {
    return httpClient.get<PublicProjectCard>(`/public/global/projects/${id}`);
  },
  globalListUnits: async (projectId: string) => {
    return httpClient.get<PublicUnit[]>(`/public/global/projects/${projectId}/units`);
  },
  globalListAllUnits: async () => {
    return httpClient.get<PublicUnit[]>(`/public/global/units`);
  },
  globalGetUnit: async (unitId: string) => {
    return httpClient.get<PublicUnit>(`/public/global/units/${unitId}`);
  },
  resolveTenant: async () => {
    return httpClient.get<{ tenantId: string }>(`/public/projects/tenant`);
  },
  list: async (tenantId: string) => {
    const params = new URLSearchParams();
    params.set('tenantId', String(tenantId));
    return httpClient.get<PublicProjectCard[]>(`/public/projects?${params.toString()}`);
  },
  get: async (id: string, tenantId: string) => {
    const params = new URLSearchParams();
    params.set('tenantId', String(tenantId));
    return httpClient.get<PublicProjectCard>(`/public/projects/${id}?${params.toString()}`);
  },
  listUnits: async (projectId: string, tenantId: string) => {
    const params = new URLSearchParams();
    params.set('tenantId', String(tenantId));
    return httpClient.get<PublicUnit[]>(`/public/projects/${projectId}/units?${params.toString()}`);
  },
};
