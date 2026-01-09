import { httpClient } from '../httpClient';

export type ProjectDb = {
  id: string;
  name: string;
  status: string;
  isClosed: boolean;
  tenantId: string;
  createdAt: string;
};

export const projectsService = {
  list: async () => {
    return httpClient.get<ProjectDb[]>('/projects');
  },
};
