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

type ProjectPerfRow = { name: string; bookings: number; revenue: number };

export const ProjectPerformanceChart = () => {
  const [rows, setRows] = useState<ProjectPerfRow[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [projectsRes, unitsRes, bookingsRes, paymentsRes] = await Promise.all([
          projectsService.list(),
          unitsService.list(),
          bookingsService.list(),
          paymentsService.list(),
        ]);

        const projects = projectsRes.success ? (projectsRes.data || []) : [];
        const units = unitsRes.success ? (unitsRes.data || []) : [];
        const bookings = bookingsRes.success ? (bookingsRes.data || []) : [];
        const payments = paymentsRes.success ? (paymentsRes.data || []) : [];

        const projectIdByUnitId = new Map<string, string>();
        for (const u of units) {
          if (u.id && u.projectId) projectIdByUnitId.set(u.id, u.projectId);
        }

        const bookingsByProjectId = new Map<string, number>();
        for (const b of bookings) {
          const pid = b.projectId || projectIdByUnitId.get(b.unitId) || '';
          if (!pid) continue;
          bookingsByProjectId.set(pid, (bookingsByProjectId.get(pid) || 0) + 1);
        }

        const revenueByProjectId = new Map<string, number>();
        for (const pay of payments) {
          if (String(pay.status) !== 'Received') continue;
          const pid = projectIdByUnitId.get(pay.unitId) || '';
          if (!pid) continue;
          revenueByProjectId.set(pid, (revenueByProjectId.get(pid) || 0) + (pay.amount || 0));
        }

        const next: ProjectPerfRow[] = [];
        for (const p of projects) {
          const bookingsCount = bookingsByProjectId.get(p.id) || 0;
          const revenueAmount = revenueByProjectId.get(p.id) || 0;
          const revenueCr = Number((revenueAmount / 10000000).toFixed(2));
          next.push({ name: p.name, bookings: bookingsCount, revenue: revenueCr });
        }

        const hasAny = next.some((r) => r.bookings > 0 || r.revenue > 0);
        setRows(hasAny ? next : []);
      } catch {
        setRows([]);
      }
    })();
  }, []);

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
