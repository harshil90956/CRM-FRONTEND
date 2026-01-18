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

export type SuperAdminUpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string;
};

export type SuperAdminActivityDb = {
  id: string;
  leadId: string;
  leadName?: string | null;
  type: string;
  message: string;
  tenantId: string;
  createdAt: string;
};

export type SuperAdminOverview = {
  kpis: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    platformRevenueReceivedAmount: number;
  };
  revenueSeries: { month: string; revenueCr: number; targetCr: number }[];
};

export type SuperAdminTenantsAnalytics = {
  items: Array<{
    tenantId: string;
    adminUserId: string;
    name: string;
    email: string;
    projects: number;
    users: number;
    subscription: string;
    status: 'Active' | 'Suspended';
    revenueReceivedAmount: number;
  }>;
};

export type SuperAdminRevenueAnalytics = {
  totalReceived: number;
  thisMonthReceived: number;
  lastMonthReceived: number;
  activeTenants: number;
  suspendedTenants: number;
  payingUsers: number;
  tenantRevenueTop: { name: string; revenueCr: number }[];
  revenueSeries: { month: string; revenueCr: number; targetCr: number }[];
};

export const superAdminUsersService = {
  list: async () => {
    return httpClient.get<SuperAdminUserDb[]>('/super-admin/users');
  },

  overview: async () => {
    return httpClient.get<SuperAdminOverview>('/super-admin/users/analytics/overview');
  },

  tenantsAnalytics: async () => {
    return httpClient.get<SuperAdminTenantsAnalytics>('/super-admin/users/analytics/tenants');
  },

  revenueAnalytics: async () => {
    return httpClient.get<SuperAdminRevenueAnalytics>('/super-admin/users/analytics/revenue');
  },

  create: async (input: SuperAdminCreateUserInput) => {
    return httpClient.post<SuperAdminUserDb>('/super-admin/users', input);
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return httpClient.patch<SuperAdminUserDb>(`/super-admin/users/${id}/status`, { isActive });
  },

  updateProfile: async (id: string, input: SuperAdminUpdateUserInput) => {
    return httpClient.patch<SuperAdminUserDb>(`/super-admin/users/${id}`, input);
  },

  activity: async (id: string) => {
    return httpClient.get<SuperAdminActivityDb[]>(`/super-admin/users/${id}/activity`);
  },

  delete: async (id: string) => {
    return httpClient.del<unknown>(`/super-admin/users/${id}`);
  },
};
