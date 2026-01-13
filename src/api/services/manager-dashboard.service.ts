import { httpClient } from '../httpClient';

export type ManagerDashboardOverview = {
  paged: { items: any[]; total: number; page: number; pageSize: number };
  summary: { total: number; new: number; qualified: number; converted: number };
  agents: { id: string; name: string }[];
  projects: any[];
  units: any[];
};

export const managerDashboardService = {
  overview: async () => {
    return httpClient.get<ManagerDashboardOverview>('/dashboard/manager/overview');
  },
};
