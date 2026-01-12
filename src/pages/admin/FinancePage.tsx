import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Download,
  MoreHorizontal,
  Plus,
  DollarSign,
  Calendar,
  Trash2,
  Mail,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useAppStore } from "@/stores/appStore";
import { paymentsService } from "@/api";
import { PaymentDetailDrawer } from "@/components/payments/PaymentDetailDrawer";

type FinancePayment = {
  id: string;
  amount: number;
  status: string;
  method?: string;
  receiptNo?: string | null;
  notes?: string | null;
  customerName?: string;
  unitNo?: string;
  createdAt: string;
  paidAt?: string | null;
  paymentType?: string | null;
  displayDate: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    Received: "status-available",
    Pending: "status-booked",
    Overdue: "status-lost",
  };
  return styles[status] || "";
};

const getReminderStatus = (payment: FinancePayment) => {
  if (payment.reminderSent) {
    return {
      text: "Reminder Sent",
      className: "text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
    };
  }
  return null;
};

export const FinancePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  useAppStore();
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReminderConfirmOpen, setIsReminderConfirmOpen] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentDrawerId, setPaymentDrawerId] = useState<string | null>(null);
  
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [newPayment, setNewPayment] = useState({
    customerName: "",
    unitNo: "",
    paymentType: "Booking",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    status: "Received"
  });

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await paymentsService.list();
      const list = (((res as any)?.data ?? []) as any[]).map((p: any) => ({
        ...p,
        displayDate: p.paidAt ?? p.createdAt,
        method: p.method ?? '',
        customerName: p.customerName ?? '',
        unitNo: p.unitNo ?? '',
        status: p.status ?? 'Pending',
      }));
      setPayments(list as FinancePayment[]);
    } catch (e) {
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await paymentsService.getSummary();
      setSummary(((res as any)?.data ?? null) as any);
    } catch {
      setSummary(null);
      toast.error('Failed to load payments summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const { page, setPage, totalPages, pageItems: paginatedPayments } = useClientPagination(payments, { pageSize: 10 });

  const formatCr = (amount: number) => {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  };

  const pnl = {
    grossRevenue: Number(summary?.totalReceivedAmount ?? 0),
    operatingCosts: 0,
    marketing: 0,
    commissions: 0,
  };
  const netProfit = pnl.grossRevenue - pnl.operatingCosts - pnl.marketing - pnl.commissions;

  const receivables = (() => {
    const buckets = {
      d0to30: 0,
      d31to60: 0,
      d60plus: 0,
    };
    const now = Date.now();
    for (const p of payments) {
      if (String(p.status) !== 'Pending' && String(p.status) !== 'Overdue') continue;
      const created = new Date(p.createdAt).getTime();
      if (!Number.isFinite(created)) continue;
      const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      if (ageDays <= 30) {
        buckets.d0to30 += p.amount;
      } else if (ageDays <= 60) {
        buckets.d31to60 += p.amount;
      } else {
        buckets.d60plus += p.amount;
      }
    }
    const total = buckets.d0to30 + buckets.d31to60 + buckets.d60plus;
    const pct = (v: number) => (total > 0 ? Math.max(5, Math.round((v / total) * 100)) : 0);
    return {
      ...buckets,
      total,
      pct0to30: pct(buckets.d0to30),
      pct31to60: pct(buckets.d31to60),
      pct60plus: pct(buckets.d60plus),
    };
  })();

  const projectRevenue = (() => {
    const byProject = new Map<string, number>();
    for (const p of payments) {
      if (String(p.status) !== 'Received') continue;
      const name = (p as any)?.projectName ? String((p as any).projectName) : 'Unknown';
      byProject.set(name, (byProject.get(name) || 0) + (p.amount || 0));
    }
    return Array.from(byProject.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  })();

  const handleExportReport = () => {
    const headers = ["Customer", "Unit", "Type", "Amount", "Date", "Status"];
    const rows = payments.map((payment) => [
      payment.customerName,
      payment.unitNo,
      payment.paymentType ?? '',
      `₹${payment.amount}`,
      payment.displayDate,
      payment.status
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Finance report exported successfully");
  };

  const handleRecordPayment = async () => {
    toast.error('Record Payment is disabled until backend payment creation is fully wired (bookingId/customerId/unitId/tenantId required).');
    setIsRecordPaymentOpen(false);
  };

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentDrawerId(String(payment?.id ?? ''));
    setPaymentDrawerOpen(true);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentDrawerId(String(payment?.id ?? ''));
    setPaymentDrawerOpen(true);
  };

  const handleSendReminder = (payment: any) => {
    setSelectedPayment(payment);
    setIsReminderConfirmOpen(true);
  };

  const handleConfirmSendReminder = async () => {
    if (!selectedPayment) return;
    toast.error('Reminders are disabled until backend reminder endpoint exists.');
    setIsReminderConfirmOpen(false);
    setSelectedPayment(null);
  };

  const handleDownloadReceipt = (payment: any) => {
    toast.error('Receipt download is disabled until backend receipt endpoint exists.');
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    toast.error('Delete is disabled until backend delete payment endpoint exists.');
    setIsDeleteConfirmOpen(false);
    setSelectedPayment(null);
  };

  const openDeleteConfirm = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <PageWrapper
      title="Finance Management"
      description="Track payments, revenue, and financial analytics."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={() => setIsRecordPaymentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Received"
          value={summaryLoading ? 'Loading...' : `₹${Number(summary?.totalReceivedAmount ?? 0).toLocaleString()}`}
          icon={IndianRupee}
          iconColor="text-success"
          delay={0}
        />
        <KPICard
          title="Pending"
          value={summaryLoading ? 'Loading...' : `₹${Number(summary?.totalPendingAmount ?? 0).toLocaleString()}`}
          icon={Clock}
          iconColor="text-warning"
          delay={0.1}
        />
        <KPICard
          title="Overdue"
          value={summaryLoading ? 'Loading...' : `₹${Number(summary?.totalOverdueAmount ?? 0).toLocaleString()}`}
          icon={AlertTriangle}
          iconColor="text-destructive"
          delay={0.2}
        />
        <KPICard
          title="Refunded"
          value={summaryLoading ? 'Loading...' : `₹${Number(summary?.totalRefundedAmount ?? 0).toLocaleString()}`}
          icon={TrendingDown}
          iconColor="text-muted-foreground"
          delay={0.3}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart />
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Profit & Loss Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold text-foreground">{summaryLoading ? 'Loading...' : formatCr(pnl.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operating Costs</span>
              <span className="font-semibold text-foreground">{summaryLoading ? 'Loading...' : formatCr(pnl.operatingCosts)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Marketing</span>
              <span className="font-semibold text-foreground">{summaryLoading ? 'Loading...' : formatCr(pnl.marketing)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commissions</span>
              <span className="font-semibold text-foreground">{summaryLoading ? 'Loading...' : formatCr(pnl.commissions)}</span>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Net Profit</span>
                <span className="text-xl font-bold text-success">{summaryLoading ? 'Loading...' : formatCr(netProfit)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Receivables Aging
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">0-30 Days</span>
                <span className="font-medium text-foreground">{isLoadingPayments ? 'Loading...' : formatCr(receivables.d0to30)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${receivables.pct0to30}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">31-60 Days</span>
                <span className="font-medium text-foreground">{isLoadingPayments ? 'Loading...' : formatCr(receivables.d31to60)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${receivables.pct31to60}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">60+ Days</span>
                <span className="font-medium text-foreground">{isLoadingPayments ? 'Loading...' : formatCr(receivables.d60plus)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: `${receivables.pct60plus}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Project-wise Revenue
          </h3>
          <div className="space-y-4">
            {isLoadingPayments ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : projectRevenue.length === 0 ? (
              <div className="text-muted-foreground">No revenue data yet.</div>
            ) : (
              projectRevenue.map((row) => (
                <div key={row.name} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{row.name}</span>
                  <span className="font-semibold text-foreground">{formatCr(row.amount)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="table-container"
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
        </div>
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPayments ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                    Loading payments...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">No payments found</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-table-row-hover transition-colors"
                >
                  <TableCell className="font-medium">{payment.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.unitNo}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.paymentType ?? ''}</TableCell>
                  <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.displayDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("status-badge", getStatusStyle(payment.status))}>
                        {payment.status}
                      </span>
                      {getReminderStatus(payment) && (
                        <span className={getReminderStatus(payment)?.className}>
                          {getReminderStatus(payment)?.text}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSendReminder(payment)}
                          disabled={payment.reminderSent}
                          className={payment.reminderSent ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reminder
                          {payment.reminderSent && <span className="ml-auto text-xs text-muted-foreground">Already sent</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadReceipt(payment)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirm(payment)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </motion.div>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>Enter payment details to record a new transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input 
                  placeholder="Enter customer name" 
                  value={newPayment.customerName} 
                  onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Number *</Label>
                <Input 
                  placeholder="e.g., A-101" 
                  value={newPayment.unitNo} 
                  onChange={(e) => setNewPayment({ ...newPayment, unitNo: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={newPayment.paymentType} onValueChange={(v) => setNewPayment({ ...newPayment, paymentType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Installment">Installment</SelectItem>
                    <SelectItem value="Final Payment">Final Payment</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={newPayment.amount} 
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input 
                  type="date" 
                  value={newPayment.date} 
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newPayment.status} onValueChange={(v) => setNewPayment({ ...newPayment, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsRecordPaymentOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDetailDrawer
        open={paymentDrawerOpen}
        onOpenChange={setPaymentDrawerOpen}
        paymentId={paymentDrawerId}
        role="admin"
        onUpdated={async () => {
          await Promise.all([loadPayments(), loadSummary()]);
        }}
      />

      {/* Send Reminder Confirmation Dialog */}
      <Dialog open={isReminderConfirmOpen} onOpenChange={setIsReminderConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send a payment reminder to the customer for the following payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">{selectedPayment.displayDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{selectedPayment.dueDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSendReminder}>
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedPayment.displayDate}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPayment && handleDeletePayment()}
            >
              Delete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
