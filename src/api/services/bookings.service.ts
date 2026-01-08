import { httpClient } from '../httpClient';

export type BookingDb = {
  id: string;
  status: string;
  customerId: string;
  unitId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  unitId: string;
  customerId: string;
};

export type UpdateBookingStatusInput = {
  status: 'HOLD' | 'BOOKED' | 'CANCELLED';
};

export const bookingsService = {
  list: async () => httpClient.get<BookingDb[]>('/bookings'),
  getById: async (id: string) => httpClient.get<BookingDb>(`/bookings/${id}`),
  create: async (input: CreateBookingInput) => httpClient.post<BookingDb>('/bookings', input),
  updateStatus: async (id: string, input: UpdateBookingStatusInput) =>
    httpClient.patch<BookingDb>(`/bookings/${id}/status`, input),
};
