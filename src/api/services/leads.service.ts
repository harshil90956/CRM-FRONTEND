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
};

export type LeadStats = {
  total: number;
  unassigned: number;
  assigned: number;
};

export type ManagerLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  priority?: string | null;
  source: string;
  budget: string | number;
  notes?: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
};

export type AllowedLeadActions = {
  canEdit: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canDelete: boolean;
};

export type ManagerAgent = {
  id: string;
  name: string;
};

export type ManagerCreateLeadInput = {
  name: string;
  email: string;
  phone: string;
  source: string;
  priority?: string;
  budget: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
};

export type ManagerUpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  priority?: string;
  budget?: string;
  notes?: string;
  projectId?: string;
  assignedToId?: string;
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

  getManagerLeads: async () => {
    const res = await httpClient.get<ManagerLead[]>('/manager/leads');
    if (!res.success) {
      throw new Error(res.message || 'Failed to load manager leads');
    }
    return res.data || [];
  },

  listManagerLeads: async () => {
    return httpClient.get<ManagerLead[]>('/manager/leads');
  },

  updateManagerLeadStatus: async (id: string, status: string) => {
    const res = await httpClient.patch<ManagerLead>(`/manager/leads/${id}/status`, { status });
    if (!res.success) {
      throw new Error(res.message || 'Failed to update manager lead status');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to update manager lead status');
    }
    return res.data;
  },

  assignManagerLead: async (id: string, assignedToId: string) => {
    const res = await httpClient.patch<ManagerLead>(`/manager/leads/${id}/assign`, { assignedToId });
    if (!res.success) {
      throw new Error(res.message || 'Failed to assign manager lead');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to assign manager lead');
    }
    return res.data;
  },

  getManagerLeadStatuses: async () => {
    const res = await httpClient.get<string[]>('/manager/leads/status');
    if (!res.success) {
      throw new Error(res.message || 'Failed to load manager lead statuses');
    }
    return res.data || [];
  },

  getManagerLeadStatusList: async () => {
    return httpClient.get<string[]>('/manager/leads/status');
  },

  getManagerAllowedActions: async (id: string) => {
    const res = await httpClient.get<AllowedLeadActions>(`/manager/leads/allowed-actions/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to load allowed actions');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to load allowed actions');
    }
    return res.data;
  },

  getManagerAgents: async () => {
    const res = await httpClient.get<ManagerAgent[]>('/manager/leads/agents');
    if (!res.success) {
      throw new Error(res.message || 'Failed to load agents');
    }
    return res.data || [];
  },

  createManagerLead: async (input: ManagerCreateLeadInput) => {
    const res = await httpClient.post<ManagerLead>('/manager/leads', input);
    if (!res.success) {
      throw new Error(res.message || 'Failed to create lead');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to create lead');
    }
    return res.data;
  },

  updateManagerLead: async (id: string, input: ManagerUpdateLeadInput) => {
    const res = await httpClient.patch<ManagerLead>(`/manager/leads/${id}`, input);
    if (!res.success) {
      throw new Error(res.message || 'Failed to update lead');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to update lead');
    }
    return res.data;
  },
};
