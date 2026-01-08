import { httpClient } from '../httpClient';

export type StaffPublic = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const staffService = {
  list: async (params?: { role?: string }) => {
    const query = params?.role ? `?role=${encodeURIComponent(params.role)}` : '';
    return httpClient.get<StaffPublic[]>(`/staff${query}`);
  },
};
