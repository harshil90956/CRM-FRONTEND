import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { bookingsService, paymentsService, projectsService, unitsService } from "@/api";
import type { BookingDb } from "@/api/services/bookings.service";
import type { PaymentDb } from "@/api/services/payments.service";
import type { ProjectDb } from "@/api/services/projects.service";
import type { UnitDb } from "@/api/services/units.service";

type ProjectPerfRow = { name: string; bookings: number; revenue: number };

export const ProjectPerformanceChart = (props: {
  projects?: ProjectDb[];
  units?: UnitDb[];
  bookings?: BookingDb[];
  payments?: PaymentDb[];
}) => {
  const [rows, setRows] = useState<ProjectPerfRow[]>([]);

  useEffect(() => {
    const compute = (projects: ProjectDb[], units: UnitDb[], bookings: BookingDb[], payments: PaymentDb[]) => {
      const projectIdByUnitId = new Map<string, string>();
      for (const u of units) {
        if ((u as any).id && (u as any).projectId) projectIdByUnitId.set((u as any).id, (u as any).projectId);
      }

      const bookingsByProjectId = new Map<string, number>();
      for (const b of bookings) {
        const pid = (b as any).projectId || projectIdByUnitId.get((b as any).unitId) || '';
        if (!pid) continue;
        bookingsByProjectId.set(pid, (bookingsByProjectId.get(pid) || 0) + 1);
      }

      const revenueByProjectId = new Map<string, number>();
      for (const pay of payments) {
        if (String((pay as any).status) !== 'Received') continue;
        const pid = projectIdByUnitId.get((pay as any).unitId) || '';
        if (!pid) continue;
        revenueByProjectId.set(pid, (revenueByProjectId.get(pid) || 0) + ((pay as any).amount || 0));
      }

      const next: ProjectPerfRow[] = [];
      for (const p of projects) {
        const bookingsCount = bookingsByProjectId.get((p as any).id) || 0;
        const revenueAmount = revenueByProjectId.get((p as any).id) || 0;
        const revenueCr = Number((revenueAmount / 10000000).toFixed(2));
        next.push({ name: (p as any).name, bookings: bookingsCount, revenue: revenueCr });
      }

      const hasAny = next.some((r) => r.bookings > 0 || r.revenue > 0);
      setRows(hasAny ? next : []);
    };

    void (async () => {
      try {
        const needProjects = props.projects === undefined;
        const needUnits = props.units === undefined;
        const needBookings = props.bookings === undefined;
        const needPayments = props.payments === undefined;

        const [projectsRes, unitsRes, bookingsRes, paymentsRes] = await Promise.all([
          needProjects ? projectsService.list() : Promise.resolve({ success: true, data: props.projects } as any),
          needUnits ? unitsService.list() : Promise.resolve({ success: true, data: props.units } as any),
          needBookings ? bookingsService.list() : Promise.resolve({ success: true, data: props.bookings } as any),
          needPayments ? paymentsService.list() : Promise.resolve({ success: true, data: props.payments } as any),
        ]);

        const projects = projectsRes.success ? (projectsRes.data || []) : [];
        const units = unitsRes.success ? (unitsRes.data || []) : [];
        const bookings = bookingsRes.success ? (bookingsRes.data || []) : [];
        const payments = paymentsRes.success ? (paymentsRes.data || []) : [];

        compute(projects as any, units as any, bookings as any, payments as any);
      } catch {
        setRows([]);
      }
    })();
  }, [props.bookings, props.payments, props.projects, props.units]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="card-elevated p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Project Performance</h3>
        <p className="text-sm text-muted-foreground">Bookings & revenue by project</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar
              dataKey="bookings"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Bookings"
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
              name="Revenue (Cr)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
