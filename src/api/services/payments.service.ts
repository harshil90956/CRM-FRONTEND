import { httpClient } from '../httpClient';

export type PaymentDb = {
  id: string;
  amount: number;
  status: string;
  bookingId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentInput = {
  bookingId: string;
  amount: number;
};

export const paymentsService = {
  list: async () => httpClient.get<PaymentDb[]>('/payments'),
  create: async (input: CreatePaymentInput) => httpClient.post<PaymentDb>('/payments', input),
};
