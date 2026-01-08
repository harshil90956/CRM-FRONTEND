// Mock API layer with simulated network latency and localStorage persistence

import { 
  projects as defaultProjects,
  units as defaultUnits,
  leads as defaultLeads,
  agents as defaultAgents,
  payments as defaultPayments,
  bookings as defaultBookings,
  reviews as defaultReviews,
  enquiries as defaultEnquiries,
  tenants as defaultTenants,
  staff as defaultStaff,
  auditLogs as defaultAuditLogs,
} from '@/data/mockData';
import { mockUsers } from '@/data/mockAuth';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(300 + Math.random() * 500);

// Storage keys
const STORAGE_PREFIX = 'crm_';

// In-memory store with localStorage persistence
const getStore = <T>(key: string): T[] | null => {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  return stored ? JSON.parse(stored) : null;
};

const setStore = <T>(key: string, data: T[]): void => {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
};

// Initialize default data
const initializeDefaults = () => {
  const defaults: Record<string, any[]> = {
    projects: defaultProjects,
    units: defaultUnits,
    leads: defaultLeads,
    agents: defaultAgents,
    payments: defaultPayments,
    adminPayments: [],
    accessGrants: [],
    bookings: defaultBookings,
    reviews: defaultReviews,
    enquiries: defaultEnquiries,
    tenants: defaultTenants,
    staff: defaultStaff,
    auditLogs: defaultAuditLogs,
    users: mockUsers,
  };

  Object.entries(defaults).forEach(([key, data]) => {
    if (!getStore(key)) {
      setStore(key, data);
    }
  });
};

// Initialize on module load
initializeDefaults();

// Generate unique ID
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const mockApi = {
  // GET - Fetch all or single item
  async get<T>(route: string, params?: Record<string, any>): Promise<T> {
    await randomDelay();
    const parts = route.replace(/^\//, '').split('/');
    const key = parts[0];
    const id = parts[1];
    
    let data = getStore<any>(key);
    if (!data) {
      initializeDefaults();
      data = getStore<any>(key);
    }
    
    if (!data) throw new Error(`No data found for ${route}`);

    if (key === 'bookings') {
      let changed = false;
      const normalized = data.map((b: any) => {
        if (b?.status === 'HOLD') {
          changed = true;
          return { ...b, status: 'HOLD_CONFIRMED' };
        }
        return b;
      });

      if (changed) {
        setStore('bookings', normalized);
        data = normalized;
      }
    }
    
    // If ID provided, return single item
    if (id) {
      const item = data.find((item: any) => item.id === id);
      if (!item) throw new Error(`Item ${id} not found`);
      return item as T;
    }
    
    // Apply filters if params provided
    if (params) {
      data = data.filter((item: any) => {
        return Object.entries(params).every(([key, value]) => {
          if (value === undefined || value === null || value === '' || value === 'all') return true;
          if (Array.isArray(value)) return value.includes(item[key]);
          return item[key] === value;
        });
      });
    }
    
    return data as T;
  },

  // POST - Create new item
  async post<T>(route: string, payload: any): Promise<T> {
    await randomDelay();
    const key = route.replace(/^\//, '').split('/')[0];
    const existing = getStore<any>(key) || [];
    
    const idPrefix = key.slice(0, -1); // Remove 's' from end
    const newItem = {
      ...payload,
      id: payload.id || generateId(idPrefix),
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...existing, newItem];
    setStore(key, updated);
    
    // Add audit log
    this.addAuditLog('CREATE', key, newItem.id, payload);
    
    return newItem as T;
  },

  // PATCH - Update existing item
  async patch<T>(route: string, id: string, payload: Partial<T>): Promise<T> {
    await randomDelay();
    const key = route.replace(/^\//, '').split('/')[0];
    const existing = getStore<any>(key) || [];
    
    const index = existing.findIndex((item: any) => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found in ${key}`);
    
    existing[index] = {
      ...existing[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    
    setStore(key, existing);
    
    // Add audit log
    this.addAuditLog('UPDATE', key, id, payload);
    
    return existing[index] as T;
  },

  // DELETE - Remove item
  async delete(route: string, id: string): Promise<void> {
    await randomDelay();
    const key = route.replace(/^\//, '').split('/')[0];
    const existing = getStore<any>(key) || [];
    
    const filtered = existing.filter((item: any) => item.id !== id);
    setStore(key, filtered);
    
    // Add audit log
    this.addAuditLog('DELETE', key, id, {});
  },

  // BULK Operations
  async bulkCreate<T>(route: string, items: any[]): Promise<T[]> {
    await randomDelay();
    const key = route.replace(/^\//, '').split('/')[0];
    const existing = getStore<any>(key) || [];
    const idPrefix = key.slice(0, -1);
    
    const newItems = items.map((item, idx) => ({
      ...item,
      id: item.id || generateId(`${idPrefix}_${idx}`),
      createdAt: new Date().toISOString(),
    }));
    
    const updated = [...existing, ...newItems];
    setStore(key, updated);
    
    return newItems as T[];
  },

  // Bulk Assign Leads
  async bulkAssign(leadIds: string[], agentIds: string[], strategy: 'round-robin' | 'equal'): Promise<any[]> {
    await randomDelay();
    const leads = getStore<any>('leads') || [];
    const agents = getStore<any>('agents') || [];
    
    const updatedLeads: any[] = [];
    
    if (strategy === 'round-robin') {
      leadIds.forEach((leadId, index) => {
        const agentIndex = index % agentIds.length;
        const agent = agents.find((a: any) => a.id === agentIds[agentIndex]);
        const leadIndex = leads.findIndex((l: any) => l.id === leadId);
        
        if (leadIndex !== -1 && agent) {
          leads[leadIndex] = {
            ...leads[leadIndex],
            assignedToId: agent.id,
            assignedTo: agent.name,
            updatedAt: new Date().toISOString(),
          };
          updatedLeads.push(leads[leadIndex]);
        }
      });
    } else {
      // Equal distribution
      const leadsPerAgent = Math.ceil(leadIds.length / agentIds.length);
      leadIds.forEach((leadId, index) => {
        const agentIndex = Math.floor(index / leadsPerAgent);
        const agent = agents.find((a: any) => a.id === agentIds[Math.min(agentIndex, agentIds.length - 1)]);
        const leadIndex = leads.findIndex((l: any) => l.id === leadId);
        
        if (leadIndex !== -1 && agent) {
          leads[leadIndex] = {
            ...leads[leadIndex],
            assignedToId: agent.id,
            assignedTo: agent.name,
            updatedAt: new Date().toISOString(),
          };
          updatedLeads.push(leads[leadIndex]);
        }
      });
    }
    
    setStore('leads', leads);
    return updatedLeads;
  },

  // Add Communication Log
  async addCommunicationLog(enquiryId: string, entry: any): Promise<any> {
    await randomDelay();
    const enquiries = getStore<any>('enquiries') || [];
    const index = enquiries.findIndex((e: any) => e.id === enquiryId);
    
    if (index === -1) throw new Error('Enquiry not found');
    
    const newEntry = {
      ...entry,
      id: generateId('comm'),
      createdAt: new Date().toISOString(),
    };
    
    enquiries[index].communicationLog = [
      ...(enquiries[index].communicationLog || []),
      newEntry,
    ];
    enquiries[index].updatedAt = new Date().toISOString();
    
    setStore('enquiries', enquiries);
    return enquiries[index];
  },

  // Hold Unit
  async holdUnit(unitId: string, customerId: string, customerData: any, tokenAmount: number, holdHours: number = 48): Promise<any> {
    await randomDelay();
    const units = getStore<any>('units') || [];
    const bookings = getStore<any>('bookings') || [];
    
    const unitIndex = units.findIndex((u: any) => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unit not found');
    if (units[unitIndex].status !== 'AVAILABLE') throw new Error('Unit not available');

    // Create hold request (PENDING). Unit status stays AVAILABLE until admin approves.
    const holdExpiry = new Date();
    holdExpiry.setHours(holdExpiry.getHours() + holdHours);
    
    const booking = {
      id: generateId('book'),
      customerId,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      unitId,
      unitNo: units[unitIndex].unitNo,
      projectId: units[unitIndex].projectId,
      projectName: units[unitIndex].project,
      tokenAmount,
      totalPrice: units[unitIndex].price,
      status: 'PENDING',
      holdHours,
      holdExpiresAt: holdExpiry.toISOString(),
      tenantId: customerData.tenantId || 't_soundarya',
      createdAt: new Date().toISOString(),
    };
    
    bookings.push(booking);
    setStore('bookings', bookings);
    
    return booking;
  },

  // Confirm Booking
  async confirmBooking(bookingId: string, agentId?: string, agentName?: string): Promise<any> {
    await randomDelay();
    const bookings = getStore<any>('bookings') || [];
    const units = getStore<any>('units') || [];
    
    const bookingIndex = bookings.findIndex((b: any) => b.id === bookingId);
    if (bookingIndex === -1) throw new Error('Booking not found');
    
    const booking = bookings[bookingIndex];
    const unitIndex = units.findIndex((u: any) => u.id === booking.unitId);
    
    // Update booking
    bookings[bookingIndex] = {
      ...booking,
      status: 'BOOKED',
      bookedAt: new Date().toISOString(),
      agentId: agentId || booking.agentId,
      agentName: agentName || booking.agentName,
      updatedAt: new Date().toISOString(),
    };
    
    // Update unit
    if (unitIndex !== -1) {
      units[unitIndex].status = 'BOOKED';
      units[unitIndex].updatedAt = new Date().toISOString();
      setStore('units', units);
    }
    
    setStore('bookings', bookings);
    return bookings[bookingIndex];
  },

  // Record Payment
  async recordPayment(paymentData: any): Promise<any> {
    await randomDelay();
    const payments = getStore<any>('payments') || [];
    
    const payment = {
      ...paymentData,
      id: generateId('pay'),
      receiptNo: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    
    payments.push(payment);
    setStore('payments', payments);
    
    return payment;
  },

  // Sync helpers
  initialize(key: string, data: any[]) {
    if (!getStore(key)) {
      setStore(key, data);
    }
  },

  getAll<T>(key: string): T[] {
    return getStore<T>(key) || [];
  },

  setAll<T>(key: string, data: T[]): void {
    setStore(key, data);
  },

  // Add audit log (internal)
  addAuditLog(action: string, entity: string, entityId: string, details: any) {
    const logs = getStore<any>('auditLogs') || [];
    const currentUser = JSON.parse(localStorage.getItem('crm_currentUser') || '{}');
    
    logs.push({
      id: generateId('audit'),
      action,
      entity,
      entityId,
      userId: currentUser.id || 'system',
      userName: currentUser.name || 'System',
      details: typeof details === 'string' ? details : JSON.stringify(details),
      tenantId: currentUser.tenantId,
      createdAt: new Date().toISOString(),
    });
    
    setStore('auditLogs', logs);
  },

  // Generate receipt HTML for download
  generateReceipt(type: 'token' | 'payment' | 'booking', data: any): string {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .title { font-size: 18px; margin-top: 10px; }
        .details { margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .total { font-size: 20px; margin-top: 20px; padding: 15px; background: #f5f5f5; text-align: right; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
      </style>
    `;

    if (type === 'token') {
      return `
        <!DOCTYPE html>
        <html>
        <head><title>Token Receipt</title>${styles}</head>
        <body>
          <div class="header">
            <div class="logo">Real Estate CRM</div>
            <div class="title">TOKEN RECEIPT</div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Receipt No:</span><span class="value">${data.receiptNo || 'TKN-' + Date.now()}</span></div>
            <div class="row"><span class="label">Date:</span><span class="value">${new Date().toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Customer:</span><span class="value">${data.customerName}</span></div>
            <div class="row"><span class="label">Property:</span><span class="value">${data.projectName} - ${data.unitNo}</span></div>
            <div class="row"><span class="label">Unit Price:</span><span class="value">₹${(data.totalPrice || 0).toLocaleString()}</span></div>
          </div>
          <div class="total">Token Amount: ₹${(data.tokenAmount || 0).toLocaleString()}</div>
          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>Hold valid until: ${data.holdExpiresAt ? new Date(data.holdExpiresAt).toLocaleString() : 'N/A'}</p>
          </div>
        </body>
        </html>
      `;
    }

    if (type === 'payment') {
      return `
        <!DOCTYPE html>
        <html>
        <head><title>Payment Receipt</title>${styles}</head>
        <body>
          <div class="header">
            <div class="logo">Real Estate CRM</div>
            <div class="title">PAYMENT RECEIPT</div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Receipt No:</span><span class="value">${data.receiptNo}</span></div>
            <div class="row"><span class="label">Date:</span><span class="value">${new Date(data.date).toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Customer:</span><span class="value">${data.customerName}</span></div>
            <div class="row"><span class="label">Unit:</span><span class="value">${data.unitNo}</span></div>
            <div class="row"><span class="label">Payment Type:</span><span class="value">${data.type}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${data.method}</span></div>
          </div>
          <div class="total">Amount Paid: ₹${(data.amount || 0).toLocaleString()}</div>
          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
          </div>
        </body>
        </html>
      `;
    }

    // Booking confirmation
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Booking Confirmation</title>${styles}</head>
      <body>
        <div class="header">
          <div class="logo">Real Estate CRM</div>
          <div class="title">BOOKING CONFIRMATION</div>
        </div>
        <div class="details">
          <div class="row"><span class="label">Booking ID:</span><span class="value">${data.id}</span></div>
          <div class="row"><span class="label">Date:</span><span class="value">${new Date(data.bookedAt || data.createdAt).toLocaleDateString()}</span></div>
          <div class="row"><span class="label">Customer:</span><span class="value">${data.customerName}</span></div>
          <div class="row"><span class="label">Email:</span><span class="value">${data.customerEmail}</span></div>
          <div class="row"><span class="label">Phone:</span><span class="value">${data.customerPhone}</span></div>
          <div class="row"><span class="label">Project:</span><span class="value">${data.projectName}</span></div>
          <div class="row"><span class="label">Unit:</span><span class="value">${data.unitNo}</span></div>
          <div class="row"><span class="label">Token Paid:</span><span class="value">₹${(data.tokenAmount || 0).toLocaleString()}</span></div>
        </div>
        <div class="total">Total Price: ₹${(data.totalPrice || 0).toLocaleString()}</div>
        <div class="footer">
          <p>Congratulations on your booking! Please contact us for any queries.</p>
        </div>
      </body>
      </html>
    `;
  },

  // Download receipt as file
  downloadReceipt(type: 'token' | 'payment' | 'booking', data: any) {
    const html = this.generateReceipt(type, data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-receipt-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Clear all data (for testing)
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    initializeDefaults();
  },

  // Export data to CSV
  exportToCSV(key: string): string {
    const data = getStore<any>(key) || [];
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map((item: any) => 
      headers.map(h => {
        const val = item[h];
        if (typeof val === 'object') return JSON.stringify(val);
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  },

  // Download CSV
  downloadCSV(key: string, filename?: string) {
    const csv = this.exportToCSV(key);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${key}-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Download Sample CSV Format
  downloadSampleCSV(type: 'leads' | 'staff' | 'units') {
    const samples: Record<string, { headers: string[]; row: string[] }> = {
      leads: {
        headers: ['name', 'email', 'phone', 'source', 'status', 'project', 'notes'],
        row: ['John Doe', 'john@example.com', '+91 9876543210', 'Website', 'NEW', 'Skyline Heights', 'Sample lead note']
      },
      staff: {
        headers: ['name', 'email', 'phone', 'role', 'department', 'salary'],
        row: ['Jane Smith', 'jane@company.com', '+91 9876543211', 'Agent', 'Sales', '50000']
      },
      units: {
        headers: ['unitNo', 'type', 'floor', 'bedrooms', 'area', 'price', 'status'],
        row: ['A-101', 'Apartment', '1', '2', '1200', '8500000', 'AVAILABLE']
      }
    };

    const sample = samples[type];
    const csv = [sample.headers.join(','), sample.row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}-format.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Staff ERP - Get Attendance
  async getAttendance(userId?: string, month?: string): Promise<any[]> {
    await randomDelay();
    const attendance = getStore<any>('attendance') || [];
    let filtered = attendance;
    
    if (userId) {
      filtered = filtered.filter((a: any) => a.userId === userId);
    }
    if (month) {
      filtered = filtered.filter((a: any) => a.date.startsWith(month));
    }
    
    return filtered;
  },

  // Staff ERP - Set Attendance
  async setAttendance(records: { userId: string; date: string; status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' }[]): Promise<any[]> {
    await randomDelay();
    const attendance = getStore<any>('attendance') || [];
    
    records.forEach(record => {
      const existingIndex = attendance.findIndex(
        (a: any) => a.userId === record.userId && a.date === record.date
      );
      
      if (existingIndex >= 0) {
        attendance[existingIndex] = { ...attendance[existingIndex], ...record, updatedAt: new Date().toISOString() };
      } else {
        attendance.push({
          id: generateId('att'),
          ...record,
          createdAt: new Date().toISOString(),
        });
      }
    });
    
    setStore('attendance', attendance);
    return attendance;
  },

  // Staff ERP - Get Salary Records
  async getSalary(userId?: string, month?: string): Promise<any[]> {
    await randomDelay();
    const salaries = getStore<any>('salaries') || [];
    let filtered = salaries;
    
    if (userId) {
      filtered = filtered.filter((s: any) => s.userId === userId);
    }
    if (month) {
      filtered = filtered.filter((s: any) => s.month === month);
    }
    
    return filtered;
  },

  // Staff ERP - Mark Salary Paid
  async setSalaryPayment(record: { userId: string; month: string; amount: number; paidOn?: string; status?: string }): Promise<any> {
    await randomDelay();
    const salaries = getStore<any>('salaries') || [];
    
    const existingIndex = salaries.findIndex(
      (s: any) => s.userId === record.userId && s.month === record.month
    );
    
    const salaryRecord = {
      id: existingIndex >= 0 ? salaries[existingIndex].id : generateId('sal'),
      ...record,
      paidOn: record.paidOn || new Date().toISOString(),
      status: record.status || 'PAID',
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      salaries[existingIndex] = salaryRecord;
    } else {
      salaries.push(salaryRecord);
    }
    
    setStore('salaries', salaries);
    this.addAuditLog('SALARY_PAID', 'salaries', salaryRecord.id, record);
    return salaryRecord;
  },

  // Close Project
  async closeProject(projectId: string): Promise<any> {
    await randomDelay();
    const projects = getStore<any>('projects') || [];
    const units = getStore<any>('units') || [];
    
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);
    if (projectIndex === -1) throw new Error('Project not found');
    
    // Mark project as closed
    projects[projectIndex] = {
      ...projects[projectIndex],
      isClosed: true,
      closedAt: new Date().toISOString(),
      status: 'CLOSED',
      updatedAt: new Date().toISOString(),
    };
    
    // Mark all project units as unavailable
    const updatedUnits = units.map((unit: any) => {
      if (unit.projectId === projectId) {
        return {
          ...unit,
          isAvailable: false,
          status: 'CLOSED',
          updatedAt: new Date().toISOString(),
        };
      }
      return unit;
    });
    
    setStore('projects', projects);
    setStore('units', updatedUnits);
    this.addAuditLog('CLOSE_PROJECT', 'projects', projectId, { reason: 'Project closed by admin' });
    
    return projects[projectIndex];
  },

  // Payment Reminder - Create
  async createPaymentReminder(paymentId: string, payload: { 
    type: 'email' | 'sms' | 'whatsapp';
    message: string;
    scheduledAt?: string;
    sendNow?: boolean;
  }): Promise<any> {
    await randomDelay();
    const payments = getStore<any>('payments') || [];
    
    const paymentIndex = payments.findIndex((p: any) => p.id === paymentId);
    if (paymentIndex === -1) throw new Error('Payment not found');
    
    const now = new Date().toISOString();
    const reminder = {
      id: generateId('rem'),
      type: payload.type,
      message: payload.message,
      scheduledAt: payload.scheduledAt || now,
      status: payload.sendNow ? 'SENT' : 'SCHEDULED',
      sentAt: payload.sendNow ? now : null,
      createdAt: now,
    };
    
    if (!payments[paymentIndex].reminders) {
      payments[paymentIndex].reminders = [];
    }
    payments[paymentIndex].reminders.push(reminder);
    
    if (!payload.sendNow && payload.scheduledAt) {
      payments[paymentIndex].nextReminderAt = payload.scheduledAt;
    }
    
    payments[paymentIndex].updatedAt = now;
    setStore('payments', payments);
    
    return reminder;
  },

  // Run Scheduled Reminders (Debug action)
  async runScheduledReminders(): Promise<number> {
    await randomDelay();
    const payments = getStore<any>('payments') || [];
    const now = new Date();
    let sentCount = 0;
    
    payments.forEach((payment: any) => {
      if (payment.reminders) {
        payment.reminders.forEach((reminder: any) => {
          if (reminder.status === 'SCHEDULED' && new Date(reminder.scheduledAt) <= now) {
            reminder.status = 'SENT';
            reminder.sentAt = now.toISOString();
            sentCount++;
          }
        });
      }
      // Clear nextReminderAt if all sent
      const pending = payment.reminders?.filter((r: any) => r.status === 'SCHEDULED') || [];
      if (pending.length === 0) {
        payment.nextReminderAt = null;
      } else {
        const nextScheduled = pending.sort((a: any, b: any) => 
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )[0];
        payment.nextReminderAt = nextScheduled?.scheduledAt;
      }
    });
    
    setStore('payments', payments);
    return sentCount;
  },

  // Get Staff (with role filter)
  async getStaff(role?: string): Promise<any[]> {
    await randomDelay();
    const staff = getStore<any>('staff') || [];
    const users = getStore<any>('users') || [];
    
    // Combine staff and users data
    const combined = users.map((user: any) => {
      const staffInfo = staff.find((s: any) => s.userId === user.id || s.email === user.email);
      return {
        ...user,
        ...staffInfo,
        salary: staffInfo?.salary || user.salary || 50000,
        department: staffInfo?.department || user.department || 'Sales',
      };
    }).filter((u: any) => u.role !== 'customer');
    
    if (role) {
      return combined.filter((s: any) => s.role === role);
    }
    
    return combined;
  },

  // Get Dashboard Live Metrics
  async getDashboardMetrics(): Promise<any> {
    await randomDelay();
    const leads = getStore<any>('leads') || [];
    const payments = getStore<any>('payments') || [];
    const units = getStore<any>('units') || [];
    const projects = getStore<any>('projects') || [];
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const newToday = leads.filter((l: any) => l.createdAt?.startsWith(todayStr)).length;
    const newYesterday = leads.filter((l: any) => l.createdAt?.startsWith(yesterdayStr)).length;
    
    const activeLeads = leads.filter((l: any) => 
      ['NEW', 'CONTACTED', 'FOLLOWUP', 'NEGOTIATION'].includes(l.status)
    ).length;
    
    const closedDeals = leads.filter((l: any) => l.status === 'CONVERTED').length;
    const conversionRate = leads.length > 0 ? ((closedDeals / leads.length) * 100).toFixed(1) : '0';
    
    const pendingPayments = payments.filter((p: any) => p.status === 'PENDING').length;
    const overduePayments = payments.filter((p: any) => 
      p.status === 'PENDING' && new Date(p.dueDate) < today
    ).length;
    
    const activeProperties = projects.filter((p: any) => !p.isClosed).length;
    
    const thisMonth = today.toISOString().slice(0, 7);
    const leadsThisMonth = leads.filter((l: any) => l.createdAt?.startsWith(thisMonth)).length;
    
    const totalRevenue = payments
      .filter((p: any) => p.status === 'PAID' && p.date?.startsWith(thisMonth))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    return {
      totalLeads: leads.length,
      newToday,
      newYesterday,
      activeLeads,
      conversionRate: parseFloat(conversionRate),
      closedDeals,
      pendingTasks: 25, // Mock
      overdueTasks: 21, // Mock
      communications: 1, // Mock
      leadsThisMonth,
      revenueThisMonth: totalRevenue,
      activeProperties,
    };
  },
};
