import { httpClient } from '../httpClient';

export type BookingDb = {
  id: string;
  status: string;
  customerId: string;
  unitId: string;
  projectId?: string;
  tenantId?: string;
  totalPrice?: number;
  tokenAmount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  status: 'HOLD_REQUESTED';
  unitId: string;
  customerId: string;
  projectId: string;
  tenantId: string;
  totalPrice: number;
  tokenAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  agentId?: string;
  managerId?: string;
};

export type CreateHoldBookingInput = CreateBookingInput & {
  holdExpiresAt?: string;
};

export type ApproveHoldInput = {
  status: 'HOLD_CONFIRMED';
  approvedAt: string;
  managerNotes?: string;
};

export type CancelBookingInput = {
  status: 'CANCELLED';
  cancelledAt: string;
  cancellationReason: string;
};

export type ApproveBookingInput = {
  status: 'BOOKING_CONFIRMED' | 'BOOKED';
  approvedAt: string;
  managerNotes?: string;
};

export type RejectHoldInput = {
  status: 'CANCELLED';
  cancelledAt: string;
  cancellationReason: string;
  managerNotes?: string;
};

export type RejectBookingInput = {
  status: 'CANCELLED' | 'REFUNDED';
  rejectedAt: string;
  cancellationReason?: string;
  managerNotes?: string;
};

export type BookingTimelineEvent = {
  key: string;
  at: string;
};

export type BookingTimelineResponse = {
  id: string;
  status: string;
  events: BookingTimelineEvent[];
};

export type UpdateBookingStatusInput = {
  status:
    | 'HOLD_REQUESTED'
    | 'HOLD_CONFIRMED'
    | 'BOOKING_PENDING_APPROVAL'
    | 'BOOKING_CONFIRMED'
    | 'PAYMENT_PENDING'
    | 'BOOKED'
    | 'CANCELLED'
    | 'REFUNDED';
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  managerNotes?: string;
};

export const bookingsService = {
  list: async () => httpClient.get<BookingDb[]>('/bookings'),
  getById: async (id: string) => httpClient.get<BookingDb>(`/bookings/${id}`),
  statuses: async () => httpClient.get<string[]>('/bookings/statuses'),
  timeline: async (id: string) => httpClient.get<BookingTimelineResponse>(`/bookings/${id}/timeline`),
  create: async (input: CreateBookingInput) => httpClient.post<BookingDb>('/bookings', input),
  hold: async (input: CreateHoldBookingInput) => httpClient.post<BookingDb>('/bookings/hold', input),
  approveHold: async (id: string, input: ApproveHoldInput) =>
    httpClient.post<BookingDb>(`/bookings/${id}/approve-hold`, input),
  rejectHold: async (id: string, input: RejectHoldInput) =>
    httpClient.post<BookingDb>(`/bookings/${id}/reject-hold`, input),
  approve: async (id: string, input: ApproveBookingInput) =>
    httpClient.post<BookingDb>(`/bookings/${id}/approve`, input),
  reject: async (id: string, input: RejectBookingInput) =>
    httpClient.post<BookingDb>(`/bookings/${id}/reject`, input),
  cancel: async (id: string, input: CancelBookingInput) =>
    httpClient.post<BookingDb>(`/bookings/${id}/cancel`, input),
  updateStatus: async (id: string, input: UpdateBookingStatusInput) =>
    httpClient.patch<BookingDb>(`/bookings/${id}/status`, input),
};
