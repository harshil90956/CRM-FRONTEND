import { httpClient } from '../httpClient';

export type LeadDb = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority?: string | null;
  budget: string | number;
  notes?: string | null;
  projectId?: string | null;
  assignedToId?: string | null;
  tenantId: string;
  createdAt: string;
};

export type CreateLeadInput = {
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority?: string;
  budget: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
  tenantId: string;
};

export type AdminCreateLeadInput = {
  name: string;
  email: string;
  phone: string;
  budget?: number | null;
  notes?: string | null;
  priority?: string;
  source: string;
  projectId?: string | null;
  tenantId: string;
};

export type AdminUpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  source?: string;
  priority?: string;
  projectId?: string;
  budget?: string;
};

export type LeadStats = {
  total: number;
  unassigned: number;
  assigned: number;
};

export const leadsService = {
  list: async () => {
    return httpClient.get<LeadDb[]>('/leads');
  },

  getById: async (id: string) => {
    return httpClient.get<LeadDb>(`/leads/${id}`);
  },

  create: async (input: CreateLeadInput) => {
    return httpClient.post<LeadDb>('/leads', input);
  },

  assign: async (id: string, staffId: string) => {
    return httpClient.patch<LeadDb>(`/leads/${id}/assign`, { assignedToId: staffId });
  },

  listAdminLeads: async () => {
    return httpClient.get<LeadDb[]>('/admin/leads');
  },

  createLead: async (input: AdminCreateLeadInput) => {
    const res = await httpClient.post<LeadDb>('/admin/leads', input);
    if (!res.success) {
      throw new Error(res.message || 'Create lead failed');
    }
    if (!res.data) {
      throw new Error(res.message || 'Create lead failed');
    }
    return res.data;
  },

  updateLead: async (id: string, input: AdminUpdateLeadInput) => {
    return httpClient.patch<LeadDb>(`/admin/leads/${id}`, input);
  },

  deleteLead: async (id: string) => {
    return httpClient.del<LeadDb>(`/admin/leads/${id}`);
  },

  updateLeadStatus: async (id: string, status: string) => {
    return httpClient.patch<LeadDb>(`/admin/leads/${id}/status`, { status });
  },

  assignLead: async (id: string, assignedToId: string) => {
    return httpClient.patch<LeadDb>(`/admin/leads/${id}/assign`, { assignedToId });
  },

  getLeadStats: async () => {
    return httpClient.get<LeadStats>('/admin/leads/stats');
  },
};
