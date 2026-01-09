import { httpClient } from '../httpClient';

export type UnitDb = {
  id: string;
  unitNo: string;
  status: string;
  projectId?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
};

export const unitsService = {
  list: async () => httpClient.get<UnitDb[]>('/units'),
};
