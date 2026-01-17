import { getFromSoftCache, httpClient, setToSoftCache } from '../httpClient';

export type ManagerDashboardOverview = {
  paged: { items: any[]; total: number; page: number; pageSize: number };
  summary: { total: number; new: number; qualified: number; converted: number };
  agents: { id: string; name: string }[];
  communications?: {
    calls: any[];
    emails: any[];
    meetings: any[];
  };
  projects: any[];
  units: any[];
};

export const managerDashboardService = {
  overview: async () => {
    const key = `frontend:dashboard:manager:overview:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<ManagerDashboardOverview>('/dashboard/manager/overview');
    setToSoftCache(key, res, 30000);
    return res;
  },
};
