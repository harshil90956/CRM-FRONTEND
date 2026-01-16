import { getFromSoftCache, httpClient, setToSoftCache } from '../httpClient';

export type PaymentDb = {
  id: string;
  amount: number;
  status: string;
  bookingId: string;
  customerId: string;
  unitId: string;
  tenantId: string;
  method?: string;
  projectName?: string;
  paidAt?: string | null;
  notes?: string | null;
  paymentType?: string | null;
  receiptNo?: string | null;
  createdAt: string;
};

export type CreatePaymentInput = {
  bookingId: string;
  customerId: string;
  unitId: string;
  tenantId: string;
  amount: number;
  status: 'Pending' | 'Received' | 'Overdue' | 'Refunded';
  method:
    | 'Bank_Transfer'
    | 'Cash'
    | 'Cheque'
    | 'Online'
    | 'UPI'
    | 'RTGS'
    | 'Card'
    | 'Net_Banking';
  paidAt?: string;
  notes?: string;
  paymentType?: string;
  receiptNo?: string;
  refundRefId?: string;
};

export type UpdatePaymentInput = Partial<{
  status: 'Pending' | 'Received' | 'Overdue' | 'Refunded';
  method:
    | 'Bank_Transfer'
    | 'Cash'
    | 'Cheque'
    | 'Online'
    | 'UPI'
    | 'RTGS'
    | 'Card'
    | 'Net_Banking';
  amount: number;
  paidAt: string | null;
  paymentType: string | null;
  receiptNo: string | null;
  notes: string | null;
  refundRefId: string | null;
}>;

export type MarkReceivedInput = {
  status: 'Received';
  paidAt: string;
  receiptNo?: string | null;
};

export type CancelPaymentInput = {
  status: 'Refunded';
  refundRefId?: string | null;
  notes?: string | null;
  paidAt?: string | null;
};

export type PaymentsSummary = {
  totalReceivedAmount: number;
  totalPendingAmount: number;
  totalOverdueAmount: number;
  totalRefundedAmount: number;
  countReceived: number;
  countPending: number;
  countOverdue: number;
  countRefunded: number;
};

export const paymentsService = {
  list: async () => {
    const key = `frontend:payments:list:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<PaymentDb[]>('/payments');
    setToSoftCache(key, res, 30000);
    return res;
  },
  create: async (input: CreatePaymentInput) => httpClient.post<PaymentDb>('/payments', input),
  getById: async (id: string) => httpClient.get<PaymentDb>(`/payments/${id}`),
  update: async (id: string, input: UpdatePaymentInput) => httpClient.patch<PaymentDb>(`/payments/${id}`, input),
  markReceived: async (id: string, input: MarkReceivedInput) =>
    httpClient.post<PaymentDb>(`/payments/${id}/mark-received`, input),
  cancel: async (id: string, input: CancelPaymentInput) => httpClient.post<PaymentDb>(`/payments/${id}/cancel`, input),
  getSummary: async () => {
    const key = `frontend:payments:summary:${JSON.stringify({})}`;
    const cached = getFromSoftCache<any>(key);
    if (cached) return cached;

    const res = await httpClient.get<PaymentsSummary>('/payments/summary');
    setToSoftCache(key, res, 30000);
    return res;
  },
};
