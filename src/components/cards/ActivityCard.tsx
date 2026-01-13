import { motion } from "framer-motion";
import { Phone, Calendar, FileText, Mail, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { adminUsersService, bookingsService, leadsService, paymentsService } from "@/api";
import { staffService } from "@/api/services/staff.service";
import { useAppStore } from "@/stores/appStore";
import type { BookingDb } from "@/api/services/bookings.service";
import type { PaymentDb } from "@/api/services/payments.service";

type ActivityRow = {
  id: string;
  type: string;
  description: string;
  agent: string;
  time: string;
};

type ActivityRowWithTs = ActivityRow & { ts: number };

type ActivityUser = {
  id: string;
  name: string;
};

type ActivityLead = {
  id: string;
  name: string;
  createdAt?: string;
  assignedToId?: string | null;
  assignedTo?: { id?: string | null } | null;
};

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ElementType> = {
    call: Phone,
    meeting: Calendar,
    note: FileText,
    email: Mail,
    booking: CreditCard,
  };
  return icons[type] || FileText;
};

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    call: "bg-info/10 text-info",
    meeting: "bg-success/10 text-success",
    note: "bg-warning/10 text-warning",
    email: "bg-primary/10 text-primary",
    booking: "bg-chart-4/10 text-chart-4",
  };
  return colors[type] || "bg-muted text-muted-foreground";
};

export const ActivityCard = (props: {
  bookings?: BookingDb[];
  payments?: PaymentDb[];
  leads?: ActivityLead[];
  users?: ActivityUser[];
}) => {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const { currentUser } = useAppStore();

  const compute = (args: {
    bookings: BookingDb[];
    payments: PaymentDb[];
    leads: ActivityLead[];
    users: ActivityUser[];
  }) => {
    const userNameById = new Map<string, string>();
    for (const u of args.users) {
      if ((u as any)?.id && (u as any)?.name) userNameById.set(String((u as any).id), String((u as any).name));
    }

    const now = Date.now();
    const minutesAgoLabel = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      const t = d.getTime();
      if (!Number.isFinite(t)) return '';
      const mins = Math.max(0, Math.round((now - t) / 60000));
      if (mins < 60) return `${mins} minutes ago`;
      const hrs = Math.round(mins / 60);
      if (hrs < 24) return `${hrs} hours ago`;
      const days = Math.round(hrs / 24);
      return `${days} days ago`;
    };

    const items: ActivityRowWithTs[] = [];

    const safeTs = (iso?: string) => {
      if (!iso) return 0;
      const d = new Date(iso);
      const t = d.getTime();
      return Number.isFinite(t) ? t : 0;
    };

    for (const b of (args.bookings || []).slice(0, 5) as any[]) {
      const ts = safeTs(b.updatedAt || b.createdAt);
      items.push({
        id: `booking_${b.id}`,
        type: 'booking',
        description: `Booking ${b.id}`,
        agent: '',
        time: minutesAgoLabel(b.updatedAt || b.createdAt),
        ts,
      });
    }

    for (const p of (args.payments || []).filter((x: any) => String(x.status) === 'Received').slice(0, 5) as any[]) {
      const ts = safeTs(p.paidAt || p.createdAt);
      items.push({
        id: `payment_${p.id}`,
        type: 'note',
        description: `Payment ${p.id}`,
        agent: '',
        time: minutesAgoLabel(p.paidAt || p.createdAt),
        ts,
      });
    }

    for (const l of (args.leads || []).slice(0, 5) as any[]) {
      const ts = safeTs(l.createdAt);
      const assignedId = typeof l.assignedToId === 'string' ? l.assignedToId : (typeof l.assignedTo?.id === 'string' ? l.assignedTo.id : '');
      items.push({
        id: `lead_${l.id}`,
        type: 'call',
        description: `Lead ${l.name}`,
        agent: userNameById.get(String(assignedId)) || '',
        time: minutesAgoLabel(l.createdAt),
        ts,
      });
    }

    const sorted = [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 5);
    setActivities(sorted.map(({ ts: _ts, ...rest }) => rest));
  };

  useEffect(() => {
    void (async () => {
      try {
        const canFetchAdminUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
        const needBookings = props.bookings === undefined;
        const needPayments = props.payments === undefined;
        const needLeads = props.leads === undefined;
        const needUsers = props.users === undefined;

        const [bookingsRes, paymentsRes, leadsRes, usersRes] = await Promise.all([
          needBookings ? bookingsService.list() : Promise.resolve({ success: true, data: props.bookings } as any),
          needPayments ? paymentsService.list() : Promise.resolve({ success: true, data: props.payments } as any),
          needLeads
            ? (canFetchAdminUsers ? leadsService.listAdminLeads() : leadsService.list())
            : Promise.resolve({ success: true, data: props.leads } as any),
          needUsers
            ? (canFetchAdminUsers ? adminUsersService.list() : staffService.list())
            : Promise.resolve({ success: true, data: props.users } as any),
        ]);

        const bookings = bookingsRes.success ? (bookingsRes.data || []) : [];
        const payments = paymentsRes.success ? (paymentsRes.data || []) : [];
        const leads = leadsRes.success ? (leadsRes.data || []) : [];
        const users = usersRes.success ? (usersRes.data || []) : [];

        compute({ bookings: bookings as any, payments: payments as any, leads: leads as any, users: users as any });
      } catch {
        setActivities([]);
      }
    })();
  }, [currentUser?.role, props.bookings, props.leads, props.payments, props.users]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest team actions</p>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  getActivityColor(activity.type)
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.agent}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
