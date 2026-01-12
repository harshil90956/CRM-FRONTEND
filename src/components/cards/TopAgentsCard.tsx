import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { adminUsersService, leadsService } from "@/api";
import { useAppStore } from "@/stores/appStore";

type AgentRow = {
  id: string;
  name: string;
  conversions: number;
  totalLeads: number;
  status: "Active" | "Inactive";
};

export const TopAgentsCard = () => {
  const [sortedAgents, setSortedAgents] = useState<AgentRow[]>([]);
  const { currentUser } = useAppStore();

  useEffect(() => {
    void (async () => {
      try {
        const canFetchAdminUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
        const [usersRes, leadsRes] = await Promise.all([
          canFetchAdminUsers ? adminUsersService.list() : Promise.resolve({ success: true, data: [] } as any),
          canFetchAdminUsers ? leadsService.listAdminLeads() : leadsService.list(),
        ]);

        const users = usersRes.success ? (usersRes.data || []) : [];
        const leads = leadsRes.success ? (leadsRes.data || []) : [];

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const createdMonthKey = (iso?: string) => {
          if (!iso) return '';
          const d = new Date(iso);
          if (!Number.isFinite(d.getTime())) return '';
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const agents = users
          .filter((u) => String(u.role).toUpperCase() === 'AGENT')
          .map((u) => {
            const myLeadsThisMonth = leads
              .filter((l) => l.assignedToId === u.id)
              .filter((l) => createdMonthKey(l.createdAt) === monthKey);
            const totalLeads = myLeadsThisMonth.length;
            const conversions = myLeadsThisMonth.filter((l) => String(l.status) === 'CONVERTED').length;
            return {
              id: u.id,
              name: u.name,
              totalLeads,
              conversions,
              status: u.isActive ? ("Active" as const) : ("Inactive" as const),
            };
          });

        const next = agents
          .filter((a) => a.status === "Active")
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 4);

        setSortedAgents(next);
      } catch {
        setSortedAgents([]);
      }
    })();
  }, [currentUser?.role]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="card-elevated p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {sortedAgents.map((agent, index) => {
          const conversionRate = agent.totalLeads > 0 ? Math.round((agent.conversions / agent.totalLeads) * 100) : 0;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground truncate">{agent.name}</span>
                  <span className="text-sm font-medium text-success flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {conversionRate}%
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <Progress value={conversionRate} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {agent.conversions}/{agent.totalLeads}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
