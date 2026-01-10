import { httpClient } from '../httpClient';

export type SuperAdminUserDb = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  tenantId: string;
  managerId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SuperAdminCreateUserInput = {
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN';
  tenantId: string;
};

export type SuperAdminActivityDb = {
  id: string;
  leadId: string;
  type: string;
  message: string;
  tenantId: string;
  createdAt: string;
};

export const superAdminUsersService = {
  list: async () => {
    return httpClient.get<SuperAdminUserDb[]>('/super-admin/users');
  },

  create: async (input: SuperAdminCreateUserInput) => {
    return httpClient.post<SuperAdminUserDb>('/super-admin/users', input);
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return httpClient.patch<SuperAdminUserDb>(`/super-admin/users/${id}/status`, { isActive });
  },

  activity: async (id: string) => {
    return httpClient.get<SuperAdminActivityDb[]>(`/super-admin/users/${id}/activity`);
  },
};
