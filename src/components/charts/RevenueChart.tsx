import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { paymentsService } from "@/api";
import type { PaymentDb } from "@/api/services/payments.service";

type RevenuePoint = {
  month: string;
  revenue: number;
  target: number;
};

export const RevenueChart = (props: { payments?: PaymentDb[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState<RevenuePoint[]>([]);

  const monthKeys = useMemo(() => {
    const now = new Date();
    const keys: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      keys.push({ key, label });
    }
    return keys;
  }, []);

  useEffect(() => {
    const compute = (payments: PaymentDb[]) => {
      const totals = new Map<string, number>();
      for (const p of payments) {
        if (String(p.status) !== 'Received') continue;
        const d = new Date(p.paidAt || p.createdAt);
        if (!Number.isFinite(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        totals.set(key, (totals.get(key) || 0) + (p.amount || 0));
      }

      const data: RevenuePoint[] = monthKeys.map(({ key, label }) => {
        const amount = totals.get(key) || 0;
        const revenueCr = Number((amount / 10000000).toFixed(2));
        return { month: label, revenue: revenueCr, target: 0 };
      });

      setPoints(data);
    };

    if (props.payments) {
      setIsLoading(false);
      compute(props.payments);
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const res = await paymentsService.list();
        const payments = res.success ? (res.data || []) : [];
        compute(payments);
      } catch {
        setPoints([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [monthKeys, props.payments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Monthly revenue vs target</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">Target</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
        )}
        {!isLoading && points.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">No revenue data yet.</div>
        )}
        {!isLoading && points.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `₹${value}Cr`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};
