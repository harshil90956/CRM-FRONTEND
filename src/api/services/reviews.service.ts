import { httpClient } from '../httpClient';

export type ReviewDb = {
  id: string;
  type: 'property' | 'agent' | 'project';
  targetId: string;
  targetName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  tenantId: string;
  createdAt: string;
};

export type ReviewsStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgRating: string;
};

export type CustomerCreateReviewInput = {
  type: 'property' | 'agent' | 'project';
  targetId: string;
  customerId: string;
  rating: number;
  comment: string;
  images?: string[];
  tenantId: string;
};

export type PublicReviewsPage = {
  data: ReviewDb[];
  meta: { total: number; limit: number; offset: number };
};

export type CustomerUpdateReviewInput = {
  customerId: string;
  rating?: number;
  comment?: string;
  images?: string[];
  delete?: boolean;
};

export const reviewsService = {
  adminList: async () => httpClient.get<ReviewDb[]>('/admin/reviews'),
  adminStats: async () => httpClient.get<ReviewsStats>('/admin/reviews/stats'),
  adminApprove: async (id: string) => httpClient.patch<ReviewDb>(`/admin/reviews/${id}/approve`, { status: 'approved' }),
  adminReject: async (id: string) => httpClient.patch<ReviewDb>(`/admin/reviews/${id}/approve`, { status: 'rejected' }),
  adminDelete: async (id: string) => httpClient.del<{ id: string }>(`/admin/reviews/${id}`),

  managerList: async () => httpClient.get<ReviewDb[]>('/manager/reviews'),
  managerStats: async () => httpClient.get<ReviewsStats>('/manager/reviews/stats'),

  agentList: async (agentId: string) => httpClient.get<ReviewDb[]>(`/agent/reviews?agentId=${encodeURIComponent(agentId)}`),

  customerList: async (customerId: string) => httpClient.get<ReviewDb[]>(`/customer/reviews?customerId=${encodeURIComponent(customerId)}`),
  customerCreate: async (input: CustomerCreateReviewInput) => httpClient.post<ReviewDb>('/customer/reviews', input),
  customerUpdate: async (id: string, input: CustomerUpdateReviewInput) => httpClient.patch<ReviewDb>(`/customer/reviews/${id}`, input),

  publicList: async (input: { type: 'project' | 'property'; targetId: string; tenantId?: string; limit?: number; offset?: number }) => {
    const limit = Math.max(1, Math.min(50, Number(input.limit) || 10));
    const offset = Math.max(0, Math.floor(Number(input.offset) || 0));

    const params = new URLSearchParams();
    params.set('type', String(input.type));
    params.set('targetId', String(input.targetId));
    if (input.tenantId) params.set('tenantId', String(input.tenantId));
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    return httpClient.get<PublicReviewsPage>(`/public/reviews?${params.toString()}`);
  },
};
