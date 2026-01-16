import { getFromSoftCache, httpClient, setToSoftCache } from '../httpClient';

export type ReportsOverview = {
  range: { from: string; to: string };
  filters: { projectId: string | null };
  kpis: {
    leads: {
      total: number;
      new: number;
      contacted: number;
      qualified: number;
      converted: number;
      lost: number;
    };
    bookings: {
      total: number;
      booked: number;
      cancelled: number;
      refunded: number;
      pendingApproval: number;
      paymentPending: number;
    };
    payments: {
      receivedAmount: number;
      pendingAmount: number;
      overdueAmount: number;
      refundedAmount: number;
    };
    units: {
      total: number;
      available: number;
      hold: number;
      booked: number;
      sold: number;
      inventoryValue: number;
    };
    projects: {
      total: number;
      active: number;
      closed: number;
    };
    users: {
      total: number;
      active: number;
      inactive: number;
      agents: number;
      managers: number;
    };
    reviews: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      avgRating: number;
    };
  };
  charts: {
    months: string[];
    leadsCreated: number[];
    bookingsCreated: number[];
    revenueReceived: number[];
  };
  breakdowns: {
    leadStatus: { key: string; count: number }[];
    leadSource: { key: string; count: number }[];
    bookingStatus: { key: string; count: number }[];
    paymentStatus: { status: string; count: number; amount: number }[];
    unitStatus: { key: string; count: number }[];
    inventoryByMainType: { mainType: string; units: number; value: number }[];
  };
  top: {
    projectsByRevenue: { projectId: string; name: string; revenue: number }[];
    projectsByLeads: { projectId: string; name: string; leads: number }[];
    staffByRevenue: {
      userId: string;
      name: string;
      role: string;
      leadsAssigned: number;
      convertedLeads: number;
      revenue: number;
    }[];
  };
};

export const adminReportsService = {
  overview: async (params?: { from?: string; to?: string; projectId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.projectId) qs.set('projectId', params.projectId);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';

    const key = `frontend:admin:reports:overview:${JSON.stringify({ from: params?.from || null, to: params?.to || null, projectId: params?.projectId || null })}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<ReportsOverview>(`/admin/reports/overview${suffix}`);
    setToSoftCache(key, res, 30000);
    return res;
  },
};
