import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { mockApi } from "@/lib/mockApi";
import { Unit } from "@/data/mockData";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";

type HoldRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type HoldRequest = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  unitId: string;
  unitNo: string;
  projectId?: string;
  projectName: string;
  tokenAmount: number;
  status: HoldRequestStatus;
  createdAt: string;
  updatedAt?: string;
  holdExpiresAt?: string;
};

export const AdminPaymentsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { toast } = useToast();

  const [requests, setRequests] = useState<HoldRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const getUnitStatus = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    return unit?.status || "";
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, unitsData] = await Promise.all([
        mockApi.get<HoldRequest[]>("/bookings"),
        mockApi.get<Unit[]>("/units"),
      ]);

      const holdRequests = (bookingsData || [])
        .filter((b) => ["PENDING", "APPROVED", "REJECTED"].includes(String((b as any).status)))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUnits(unitsData || []);
      setRequests(holdRequests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approve = async (request: HoldRequest) => {
    if (request.status !== "PENDING") return;

    await mockApi.patch<HoldRequest>("/bookings", request.id, {
      status: "APPROVED" as const,
      approvedAt: new Date().toISOString(),
    } as any);

    await mockApi.patch<Unit>("/units", request.unitId, {
      status: "HOLD",
    } as Partial<Unit>);

    toast({ title: "Approved", description: "Unit is now on HOLD." });
    await loadData();
  };

  const reject = async (request: HoldRequest) => {
    if (request.status !== "PENDING") return;

    await mockApi.patch<HoldRequest>("/bookings", request.id, {
      status: "REJECTED" as const,
      rejectedAt: new Date().toISOString(),
    } as any);

    await mockApi.patch<Unit>("/units", request.unitId, {
      status: "AVAILABLE",
    } as Partial<Unit>);

    toast({ title: "Rejected", description: "Unit remains AVAILABLE." });
    await loadData();
  };

  const statusBadge = (status: HoldRequestStatus) => {
    if (status === "APPROVED") return <span className="status-badge status-available">APPROVED</span>;
    if (status === "REJECTED") return <span className="status-badge status-lost">REJECTED</span>;
    return <span className="status-badge status-booked">PENDING</span>;
  };

  const filteredRequests = useMemo(() => {
    return requests;
  }, [requests]);

  const { page, setPage, totalPages, pageItems: paginatedRequests } = useClientPagination(filteredRequests, { pageSize: 10 });

  return (
    <PageWrapper
      title="Payments"
      description="Review customer hold requests and approve/reject."
      sidebarCollapsed={sidebarCollapsed}
    >
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="p-6">
          <div className="table-container">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead>Customer</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Unit Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.map((r) => (
                  <TableRow key={r.id} className="hover:bg-table-row-hover">
                    <TableCell className="font-medium">
                      {r.customerName}
                      <div className="text-xs text-muted-foreground">{r.customerEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium">{r.unitNo}</TableCell>
                    <TableCell className="text-muted-foreground">{r.projectName}</TableCell>
                    <TableCell className="font-semibold">₹{Number(r.tokenAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{getUnitStatus(r.unitId)}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={r.status !== "PENDING" || loading} onClick={() => approve(r)}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={r.status !== "PENDING" || loading} onClick={() => reject(r)}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-0" />
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};
