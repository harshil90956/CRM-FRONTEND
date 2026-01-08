import { httpClient } from '../httpClient';

export type LeadDb = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  priority?: string | null;
  budget: string;
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
};
