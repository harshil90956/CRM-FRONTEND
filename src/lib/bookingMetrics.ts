export type BookingStatusLike =
  | 'HOLD_REQUESTED'
  | 'HOLD_CONFIRMED'
  | 'BOOKING_PENDING_APPROVAL'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'BOOKED'
  | 'CANCELLED'
  | 'REFUNDED'
  | string;

export type BookingLike = {
  id: string;
  status: BookingStatusLike;
  totalPrice?: number;
  tokenAmount?: number;
};

export type PaymentStatusLike = 'Pending' | 'Received' | 'Overdue' | 'Refunded' | string;

export type PaymentLike = {
  id: string;
  bookingId?: string | null;
  amount?: number;
  status?: PaymentStatusLike;
  paymentType?: string | null;
};

export type BookingFinancials = {
  bookingId: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
};

export type AdminBookingsMetrics<B extends BookingLike = BookingLike> = {
  paymentPendingBookings: B[];
  completedBookings: B[];
  cancelledBookings: B[];
  paidAmountByBookingId: Map<string, number>;
  remainingAmountByBookingId: Map<string, number>;
  totalRevenue: number;
  pendingRevenue: number;
};

const isCancelledStatus = (status: string) => status === 'CANCELLED' || status === 'REFUNDED';

const isBookedStatus = (status: string) => status === 'BOOKED';

const isBookingPayment = (p: PaymentLike) => {
  const bookingId = p?.bookingId ? String(p.bookingId) : '';
  const paymentType = p?.paymentType ? String(p.paymentType) : '';
  return Boolean(bookingId) || paymentType === 'Booking' || paymentType === 'Token' || paymentType === 'Installment';
};

export const computeAdminBookingsMetrics = <B extends BookingLike>(
  bookings: B[],
  payments: PaymentLike[],
): AdminBookingsMetrics<B> => {
  const paidAmountByBookingId = new Map<string, number>();

  for (const p of payments) {
    if (!isBookingPayment(p)) continue;
    const bookingId = p?.bookingId ? String(p.bookingId) : '';
    if (!bookingId) continue;

    const amount = Number(p?.amount) || 0;
    const status = String(p?.status ?? '');

    const prev = paidAmountByBookingId.get(bookingId) ?? 0;
    if (status === 'Received') {
      paidAmountByBookingId.set(bookingId, prev + amount);
    } else if (status === 'Refunded') {
      paidAmountByBookingId.set(bookingId, prev - amount);
    } else {
      paidAmountByBookingId.set(bookingId, prev);
    }
  }

  const remainingAmountByBookingId = new Map<string, number>();
  for (const b of bookings) {
    const totalPrice = Number((b as any)?.totalPrice) || 0;
    const unclampedPaidAmount = paidAmountByBookingId.get(String(b.id)) ?? 0;
    const tokenAmount = Number((b as any)?.tokenAmount) || 0;
    const basePaidAmount = Math.max(0, unclampedPaidAmount);
    const paidAmount = basePaidAmount === 0 && tokenAmount > 0 ? tokenAmount : basePaidAmount;
    paidAmountByBookingId.set(String(b.id), paidAmount);
    const remaining = Math.max(0, totalPrice - paidAmount);
    remainingAmountByBookingId.set(String(b.id), remaining);
  }

  const cancelledBookings = bookings.filter((b) => isCancelledStatus(String(b.status)));

  const completedBookings = bookings.filter((b) => {
    const remaining = remainingAmountByBookingId.get(String(b.id)) ?? 0;
    return isBookedStatus(String(b.status)) && remaining === 0;
  });

  const paymentPendingBookings = bookings.filter((b) => {
    if (isCancelledStatus(String(b.status))) return false;
    const remaining = remainingAmountByBookingId.get(String(b.id)) ?? 0;
    return remaining > 0;
  });

  const totalRevenue = bookings.reduce((sum, b) => {
    if (isCancelledStatus(String(b.status))) return sum;
    const paid = paidAmountByBookingId.get(String(b.id)) ?? 0;
    return sum + Math.max(0, paid);
  }, 0);

  const pendingRevenue = paymentPendingBookings.reduce((sum, b) => {
    const remaining = remainingAmountByBookingId.get(String(b.id)) ?? 0;
    return sum + Math.max(0, remaining);
  }, 0);

  return {
    paymentPendingBookings,
    completedBookings,
    cancelledBookings,
    paidAmountByBookingId,
    remainingAmountByBookingId,
    totalRevenue,
    pendingRevenue,
  };
};
