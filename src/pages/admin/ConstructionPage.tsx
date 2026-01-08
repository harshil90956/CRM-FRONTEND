import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { HardHat, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

const milestones = [
  { id: 1, name: "Foundation Complete", project: "Green Valley", status: "completed", date: "2024-01-10", progress: 100 },
  { id: 2, name: "Structure - Floor 5", project: "Green Valley", status: "in-progress", date: "2024-02-15", progress: 65 },
  { id: 3, name: "Electrical Work", project: "Sky Heights", status: "in-progress", date: "2024-02-20", progress: 40 },
  { id: 4, name: "Plumbing - Tower A", project: "Palm Residency", status: "delayed", date: "2024-01-30", progress: 25 },
  { id: 5, name: "Interior Finishing", project: "Green Valley", status: "upcoming", date: "2024-03-01", progress: 0 },
];

const materials = [
  { id: 1, name: "Cement (OPC 53)", quantity: "5000 bags", received: "4200 bags", status: "In Stock" },
  { id: 2, name: "Steel TMT Bars", quantity: "200 MT", received: "180 MT", status: "Low Stock" },
  { id: 3, name: "Bricks (Class A)", quantity: "100000 pcs", received: "85000 pcs", status: "In Stock" },
  { id: 4, name: "Sand (River)", quantity: "500 CFT", received: "350 CFT", status: "Ordered" },
];

const statusColors = { completed: "text-success", "in-progress": "text-info", delayed: "text-destructive", upcoming: "text-muted-foreground" };
const statusIcons = { completed: CheckCircle2, "in-progress": Clock, delayed: AlertTriangle, upcoming: Clock };

export const ConstructionPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const { page: milestonesPage, setPage: setMilestonesPage, totalPages: milestonesTotalPages, pageItems: paginatedMilestones } = useClientPagination(milestones, { pageSize: 5 });
  const { page: materialsPage, setPage: setMaterialsPage, totalPages: materialsTotalPages, pageItems: paginatedMaterials } = useClientPagination(materials, { pageSize: 10 });

  return (
    <PageWrapper title="Construction Management" description="Track project milestones and materials." sidebarCollapsed={sidebarCollapsed}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><HardHat className="w-5 h-5" />Milestone Timeline</h3>
            <div className="space-y-4">
              {paginatedMilestones.map((milestone) => {
                const Icon = statusIcons[milestone.status as keyof typeof statusIcons];
                return (
                  <div key={milestone.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Icon className={`w-5 h-5 ${statusColors[milestone.status as keyof typeof statusColors]}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{milestone.name}</p>
                        <Badge variant="outline">{milestone.project}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={milestone.progress} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground w-12">{milestone.progress}%</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{milestone.date}</span>
                  </div>
                );
              })}
            </div>
            <PaginationBar page={milestonesPage} totalPages={milestonesTotalPages} onPageChange={setMilestonesPage} className="px-0" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
            <div className="space-y-4">
              <div><p className="text-sm text-muted-foreground mb-1">Green Valley</p><Progress value={72} className="h-3" /><p className="text-xs text-right mt-1">72%</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">Sky Heights</p><Progress value={58} className="h-3" /><p className="text-xs text-right mt-1">58%</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">Palm Residency</p><Progress value={85} className="h-3" /><p className="text-xs text-right mt-1">85%</p></div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Package className="w-5 h-5" />Material Tracker</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header hover:bg-table-header">
                <TableHead>Material</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMaterials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-medium">{mat.name}</TableCell>
                  <TableCell>{mat.quantity}</TableCell>
                  <TableCell>{mat.received}</TableCell>
                  <TableCell>
                    <Badge variant={mat.status === "Low Stock" ? "destructive" : mat.status === "Ordered" ? "secondary" : "default"}>{mat.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar page={materialsPage} totalPages={materialsTotalPages} onPageChange={setMaterialsPage} className="px-0" />
        </Card>
      </motion.div>
    </PageWrapper>
  );
};
