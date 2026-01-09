// Mock API is DISABLED for production-safe behavior.
// Any remaining import/use of mockApi must fail fast.

const disabled = (name: string) => {
  throw new Error(`mockApi is disabled: attempted to call ${name}`);
};

export const mockApi = {
  get: async <T>(..._args: any[]): Promise<T> => disabled('get'),
  post: async <T>(..._args: any[]): Promise<T> => disabled('post'),
  patch: async <T>(..._args: any[]): Promise<T> => disabled('patch'),
  delete: async (..._args: any[]): Promise<void> => disabled('delete'),
  bulkCreate: async <T>(..._args: any[]): Promise<T[]> => disabled('bulkCreate'),
  bulkAssign: async (..._args: any[]): Promise<any[]> => disabled('bulkAssign'),
  addCommunicationLog: async (..._args: any[]): Promise<any> => disabled('addCommunicationLog'),
  addAuditLog: (..._args: any[]) => disabled('addAuditLog'),
  recordPayment: async (..._args: any[]): Promise<any> => disabled('recordPayment'),
  createPaymentReminder: async (..._args: any[]): Promise<any> => disabled('createPaymentReminder'),
  runScheduledReminders: async (..._args: any[]): Promise<any> => disabled('runScheduledReminders'),
  downloadReceipt: (..._args: any[]) => disabled('downloadReceipt'),
  getDashboardMetrics: async () => {
    return {
      totalLeads: 0,
      newToday: 0,
      newYesterday: 0,
      activeLeads: 0,
      conversionRate: 0,
      closedDeals: 0,
      communications: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      leadsThisMonth: 0,
      revenueThisMonth: 0,
      activeProperties: 0,
    };
  },
  downloadSampleCSV: (type: string) => {
    const headersByType: Record<string, string[]> = {
      leads: ['name', 'email', 'phone', 'status', 'project', 'budget'],
    };

    const headers = headersByType[type] || ['id'];
    const csv = `${headers.join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  getAll: (..._args: any[]) => disabled('getAll'),
};
