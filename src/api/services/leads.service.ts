import { getFromSoftCache, httpClient, setToSoftCache } from '../httpClient';

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
  dynamicData?: Record<string, any> | null;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
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
  dynamicData?: Record<string, any>;
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
  dynamicData?: Record<string, any>;
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
  dynamicData?: Record<string, any>;
};

export type LeadStats = {
  total: number;
  unassigned: number;
  assigned: number;
};

export type ManagerLeadsSummary = {
	total: number;
	new: number;
	qualified: number;
	converted: number;
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
  dynamicData?: Record<string, any> | null;
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

export type PaginatedResult<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
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
  dynamicData?: Record<string, any>;
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
  dynamicData?: Record<string, any>;
};

 export type AgentUpdateLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  priority?: string;
  budget?: string;
  notes?: string;
  projectId?: string;
  dynamicData?: Record<string, any>;
 };

 export type AgentCreateLeadInput = {
  name: string;
  email: string;
  phone: string;
  source: string;
  priority?: string;
  budget: string;
  notes?: string;
  projectId?: string;
  dynamicData?: Record<string, any>;
};

export type AgentLogActivityInput = {
  activityType: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE';
  notes: string;
  status?: string;
};

export type LeadsImportResult = {
  total: number;
  created: number;
  skipped: number;
};

export type LeadFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX';

export type LeadField = {
  id: string;
  tenantId: string;
  projectId: string | null;
  key: string;
  label: string;
  type: LeadFieldType;
  options: string[] | null;
  required: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCreateLeadFieldInput = {
  tenantId?: string;
  projectId?: string | null;
  key: string;
  label: string;
  type: LeadFieldType;
  options?: string[] | null;
  required?: boolean;
  order?: number;
};

export type AdminUpdateLeadFieldInput = {
  tenantId?: string;
  projectId?: string | null;
  key?: string;
  label?: string;
  type?: LeadFieldType;
  options?: string[] | null;
  required?: boolean;
  order?: number;
};

export const leadsService = {
  list: async () => {
    return httpClient.get<LeadDb[]>('/leads');
  },

  importCsv: async (file: File, projectId?: string | null) => {
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    const path = params.toString() ? `/leads/import?${params.toString()}` : '/leads/import';

    return httpClient.rawPost<{ success: boolean; data?: LeadsImportResult; message?: string }>(
      path,
      form,
    );
  },

  importAdminCsv: async (file: File, projectId?: string | null) => {
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    const path = params.toString() ? `/admin/leads/import?${params.toString()}` : '/admin/leads/import';

    return httpClient.rawPost<{ success: boolean; data?: LeadsImportResult; message?: string }>(
      path,
      form,
    );
  },

  importManagerCsv: async (file: File, projectId?: string | null) => {
    const form = new FormData();
    form.append('file', file);

    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    const path = params.toString() ? `/manager/leads/import?${params.toString()}` : '/manager/leads/import';

    return httpClient.rawPost<{ success: boolean; data?: LeadsImportResult; message?: string }>(
      path,
      form,
    );
  },

  listAgentLeads: async () => {
    const key = `frontend:agent:leads:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<LeadDb[]>('/agent/leads');
    setToSoftCache(key, res, 30000);
    return res;
  },

  getById: async (id: string) => {
    return httpClient.get<LeadDb>(`/leads/${id}`);
  },

  create: async (input: CreateLeadInput) => {
    return httpClient.post<LeadDb>('/leads', input);
  },

  createAgentLead: async (input: AgentCreateLeadInput) => {
    return httpClient.post<LeadDb>('/agent/leads', input);
  },

  updateAgentLead: async (id: string, input: AgentUpdateLeadInput) => {
    return httpClient.patch<LeadDb>(`/agent/leads/${id}`, input);
  },

  logAgentLeadActivity: async (id: string, input: AgentLogActivityInput) => {
    return httpClient.post<LeadDb>(`/agent/leads/${id}/activity`, input);
  },

  listLeadFields: async (projectId?: string | null, tenantId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.set('tenantId', tenantId);
    if (projectId) params.set('projectId', projectId);
    const key = `frontend:admin:lead-fields:${JSON.stringify({ tenantId: tenantId || null, projectId: projectId || null })}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<LeadField[]>(`/admin/lead-fields?${params.toString()}`);
    setToSoftCache(key, res, 30000);
    return res;
  },

  createLeadField: async (input: AdminCreateLeadFieldInput) => {
    return httpClient.post<LeadField>('/admin/lead-fields', input);
  },

  updateLeadField: async (id: string, input: AdminUpdateLeadFieldInput) => {
    return httpClient.put<LeadField>(`/admin/lead-fields/${id}`, input);
  },

  deleteLeadField: async (id: string) => {
    return httpClient.del<LeadField>(`/admin/lead-fields/${id}`);
  },

  assign: async (id: string, staffId: string) => {
    return httpClient.patch<LeadDb>(`/leads/${id}/assign`, { assignedToId: staffId });
  },

  listAdminLeads: async () => {
    const key = `frontend:admin:leads:list:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<LeadDb[]>('/admin/leads');
    setToSoftCache(key, res, 30000);
    return res;
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
    const key = `frontend:admin:leads:stats:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<LeadStats>('/admin/leads/stats');
    setToSoftCache(key, res, 30000);
    return res;
  },

  getManagerLeads: async (args?: { page?: number; pageSize?: number }) => {
		const params = new URLSearchParams();
		if (args?.page) params.set('page', String(args.page));
		if (args?.pageSize) params.set('pageSize', String(args.pageSize));
		const path = params.toString() ? `/manager/leads?${params.toString()}` : '/manager/leads';

		const key = `frontend:manager:leads:list:${JSON.stringify({ page: args?.page ?? null, pageSize: args?.pageSize ?? null })}`;
		const cached = getFromSoftCache<any>(key);
		if (cached) return cached;

		const res = await httpClient.get<PaginatedResult<ManagerLead>>(path);
		if (!res.success) {
			throw new Error(res.message || 'Failed to load manager leads');
		}
		if (!res.data) {
			throw new Error(res.message || 'Failed to load manager leads');
		}
		setToSoftCache(key, res.data, 30000);
		return res.data;
	},

	getManagerLeadsSummary: async () => {
		const key = `frontend:manager:leads:summary:${JSON.stringify({})}`;
		const cached = getFromSoftCache<any>(key);
		if (cached) return cached;

		const res = await httpClient.get<ManagerLeadsSummary>('/manager/leads/summary');
		if (!res.success) {
			throw new Error(res.message || 'Failed to load lead summary');
		}
		if (!res.data) {
			throw new Error(res.message || 'Failed to load lead summary');
		}
		setToSoftCache(key, res.data, 30000);
		return res.data;
	},

  listManagerLeads: async () => {
		const res = await leadsService.getManagerLeads({ page: 1, pageSize: 20 });
		return res.items;
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
    const key = `frontend:manager:leads:status:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<string[]>('/manager/leads/status');
    if (!res.success) {
      throw new Error(res.message || 'Failed to load manager lead statuses');
    }
    const out = res.data || [];
    setToSoftCache(key, out, 30000);
    return out;
  },

  getManagerLeadStatusList: async () => {
    const key = `frontend:manager:leads:status:list:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<string[]>('/manager/leads/status');
    setToSoftCache(key, res, 30000);
    return res;
  },

  getManagerAgents: async () => {
    const key = `frontend:manager:leads:agents:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<ManagerAgent[]>('/manager/leads/agents');
    if (!res.success) {
      throw new Error(res.message || 'Failed to load agents');
    }
    const out = res.data || [];
    setToSoftCache(key, out, 30000);
    return out;
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

  deleteManagerLead: async (id: string) => {
    const res = await httpClient.del<ManagerLead>(`/manager/leads/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete lead');
    }
    if (!res.data) {
      throw new Error(res.message || 'Failed to delete lead');
    }
    return res.data;
  },
};
