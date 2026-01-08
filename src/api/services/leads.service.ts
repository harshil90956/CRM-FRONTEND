import { httpClient } from '../httpClient';

export type LeadDb = {
  id: string;
  name: string;
  phone: string;
  staffId: string;
  customerId?: string | null;
  createdAt: string;
};

export type CreateLeadInput = {
  name: string;
  phone: string;
  staffId: string;
  customerId?: string;
};

export const leadsService = {
  list: async () => {
    return httpClient.get<LeadDb[]>('/leads');
  },

  create: async (input: CreateLeadInput) => {
    return httpClient.post<LeadDb>('/leads', input);
  },

  assign: async (id: string, staffId: string) => {
    return httpClient.patch<LeadDb>(`/leads/${id}/assign`, { staffId });
  },
};
