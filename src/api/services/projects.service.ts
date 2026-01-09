import { httpClient } from '../httpClient';

export type ProjectDb = {
  id: string;
  name: string;
  location: string;
  status: string;
  priceRange: string;
  isClosed?: boolean;
  tenantId: string;
  description?: string | null;
  mainType: string;
  createdAt: string;

  totalUnits: number;
  soldUnits: number;
  bookedUnits: number;
  availableUnits: number;
};

export type CreateProjectInput = {
  name: string;
  location: string;
  status?: string;
  priceRange?: string;
  description?: string;
  tenantId?: string;
  mainType?: string;
};

export type UpdateProjectInput = {
  name?: string;
  location?: string;
  status?: string;
  priceRange?: string;
  description?: string;
  tenantId?: string;
  mainType?: string;
  isClosed?: boolean;
};

export const projectsService = {
  list: async () => {
    return httpClient.get<ProjectDb[]>('/projects');
  },

  create: async (input: CreateProjectInput) => {
    return httpClient.post<ProjectDb>('/projects', input);
  },

  update: async (id: string, input: UpdateProjectInput) => {
    return httpClient.patch<ProjectDb>(`/projects/${id}`, input);
  },

  delete: async (id: string) => {
    return httpClient.del<{ id: string }>(`/projects/${id}`);
  },
};