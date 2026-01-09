import { httpClient } from '../httpClient';

export type AdminUserDb = {
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

export type AdminCreateUserInput = {
  name: string;
  email: string;
  phone?: string;
  role: 'MANAGER' | 'AGENT';
  managerId?: string | null;
};

export type AdminUpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  managerId?: string | null;
};

export const adminUsersService = {
  list: async () => {
    return httpClient.get<AdminUserDb[]>('/admin/users');
  },

  create: async (input: AdminCreateUserInput) => {
    return httpClient.post<AdminUserDb>('/admin/users', input);
  },

  update: async (id: string, input: AdminUpdateUserInput) => {
    return httpClient.patch<AdminUserDb>(`/admin/users/${id}`, input);
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return httpClient.patch<AdminUserDb>(`/admin/users/${id}/status`, { isActive });
  },

  updateRole: async (id: string, role: 'MANAGER' | 'AGENT') => {
    return httpClient.patch<AdminUserDb>(`/admin/users/${id}/role`, { role });
  },

  delete: async (id: string) => {
    return httpClient.del<void>(`/admin/users/${id}`);
  },
};
