import { httpClient } from '../httpClient';

export type ManagerTeamUserDb = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  tenantId: string;
  managerId?: string | null;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ManagerCreateAgentInput = {
  name: string;
  email: string;
  phone?: string;
  projectId?: string;
};

export const managerTeamService = {
  list: async () => {
    return httpClient.get<ManagerTeamUserDb[]>('/manager/team');
  },

  createAgent: async (input: ManagerCreateAgentInput) => {
    return httpClient.post<ManagerTeamUserDb>('/manager/team', input);
  },

  updateStatus: async (userId: string, isActive: boolean) => {
    return httpClient.patch<ManagerTeamUserDb>(`/manager/team/${userId}/status`, { isActive });
  },
};
