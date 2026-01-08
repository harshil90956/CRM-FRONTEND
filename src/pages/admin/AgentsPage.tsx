import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  TrendingUp,
  Award,
  IndianRupee,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Mail,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { agents } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

export const AgentsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const { page, setPage, totalPages, pageItems: paginatedAgents } = useClientPagination(agents, { pageSize: 9 });

  const totalLeads = agents.reduce((sum, a) => sum + a.totalLeads, 0);
  const totalConversions = agents.reduce((sum, a) => sum + a.conversions, 0);
  const avgConversion = Math.round((totalConversions / totalLeads) * 100);

  return (
    <PageWrapper
      title="Agent Management"
      description="Manage your sales team and track performance."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Agents"
          value={agents.length}
          icon={Users}
          delay={0}
        />
        <KPICard
          title="Active Agents"
          value={agents.filter((a) => a.status === "Active").length}
          icon={TrendingUp}
          iconColor="text-success"
          delay={0.1}
        />
        <KPICard
          title="Avg. Conversion"
          value={`${avgConversion}%`}
          icon={Award}
          iconColor="text-warning"
          delay={0.2}
        />
        <KPICard
          title="Total Revenue"
          value="₹19.6 Cr"
          change={15}
          changeLabel="this month"
          icon={IndianRupee}
          iconColor="text-primary"
          delay={0.3}
        />
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedAgents.map((agent, index) => {
          const conversionRate = Math.round(
            (agent.conversions / agent.totalLeads) * 100
          );

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {agent.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {agent.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {agent.phone}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-semibold text-foreground">
                      {agent.totalLeads}
                    </p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                  <div className="text-center p-2 bg-success/5 rounded-lg">
                    <p className="text-lg font-semibold text-success">
                      {agent.conversions}
                    </p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="text-center p-2 bg-primary/5 rounded-lg">
                    <p className="text-lg font-semibold text-primary">
                      {conversionRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">{conversionRate}%</span>
                  </div>
                  <Progress value={conversionRate} className="h-2" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-foreground">{agent.revenue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm",
                        agent.status === "Active"
                          ? "text-success"
                          : "text-muted-foreground"
                      )}
                    >
                      {agent.status}
                    </span>
                    <Switch checked={agent.status === "Active"} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
    </PageWrapper>
  );
};
