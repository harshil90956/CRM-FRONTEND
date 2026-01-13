import { httpClient } from '../httpClient';

export type SuperAdminBookingsOverview = {
  totalBookings: number;
  booked: number;
  holds: number;
  cancelledOrRefunded: number;
  totalBookingValue: number;
  totalTokenValue: number;
};

export type SuperAdminBookingsByProject = {
  items: Array<{
    projectId: string;
    projectName: string;
    tenantId: string;
    totalBookings: number;
    booked: number;
    holds: number;
    cancelledOrRefunded: number;
    totalBookingValue: number;
    totalTokenValue: number;
  }>;
};

export const superAdminBookingsService = {
  overview: async () => {
    return httpClient.get<SuperAdminBookingsOverview>('/super-admin/bookings/analytics/overview');
  },
  projects: async () => {
    return httpClient.get<SuperAdminBookingsByProject>('/super-admin/bookings/analytics/projects');
  },
};
