import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { leadsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

type FunnelRow = { stage: string; count: number; color: string };

export const LeadFunnelChart = () => {
  const [rows, setRows] = useState<FunnelRow[]>([]);
  const { currentUser } = useAppStore();

  const baseRows = useMemo<FunnelRow[]>(
    () => [
      { stage: 'New Leads', count: 0, color: 'hsl(217, 91%, 60%)' },
      { stage: 'Contacted', count: 0, color: 'hsl(199, 89%, 48%)' },
      { stage: 'Qualified', count: 0, color: 'hsl(38, 92%, 50%)' },
      { stage: 'Won', count: 0, color: 'hsl(142, 76%, 36%)' },
    ],
    []
  );

  useEffect(() => {
    void (async () => {
      try {
        const role = String(currentUser?.role || '').toUpperCase();
        const res =
          role === 'ADMIN' || role === 'SUPER_ADMIN'
            ? await leadsService.listAdminLeads()
            : role === 'MANAGER'
              ? ({ success: true, data: await leadsService.listManagerLeads() } as any)
              : await leadsService.list();
        const leads = res.success ? (res.data || []) : [];

        const next = baseRows.map((r) => ({ ...r }));
        const add = (stage: FunnelRow['stage']) => {
          const row = next.find((x) => x.stage === stage);
          if (row) row.count += 1;
        };

        for (const l of leads) {
          const s = String(l.status);
          if (s === 'NEW') add('New Leads');
          else if (s === 'CONTACTED') add('Contacted');
          else if (s === 'QUALIFIED') add('Qualified');
          else if (s === 'CONVERTED') add('Won');
        }

        setRows(next);
      } catch {
        setRows(baseRows);
      }
    })();
  }, [baseRows, currentUser?.role]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card-elevated p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Lead Funnel</h3>
        <p className="text-sm text-muted-foreground">Conversion through stages</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              dataKey="stage"
              type="category"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {rows.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
