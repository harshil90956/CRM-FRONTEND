export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';
  tenantId?: string;
  tenantName?: string;
  phone?: string;
  avatar?: string;
}

export const mockUsers: User[] = [
  { id: 'u_super_1', name: 'Platform Admin', email: 'platform@realcrm.test', role: 'SUPER_ADMIN' },
  { id: 'u_admin_1', name: 'Admin - Soundarya Group', email: 'admin@soundarya.test', role: 'ADMIN', tenantId: 't_soundarya', tenantName: 'Soundarya Group' },
  { id: 'u_admin_2', name: 'Admin - Prestige', email: 'admin@prestige.test', role: 'ADMIN', tenantId: 't_prestige', tenantName: 'Prestige Group' },
  { id: 'u_mgr_1', name: 'Priya Singh', email: 'priya@soundarya.test', role: 'MANAGER', tenantId: 't_soundarya', tenantName: 'Soundarya Group' },
  { id: 'u_mgr_2', name: 'Amit Patel', email: 'amit@prestige.test', role: 'MANAGER', tenantId: 't_prestige', tenantName: 'Prestige Group' },
  { id: 'u_agent_1', name: 'Rahul Verma', email: 'rahul@soundarya.test', role: 'AGENT', tenantId: 't_soundarya', tenantName: 'Soundarya Group' },
  { id: 'u_agent_2', name: 'Neha Gupta', email: 'neha@prestige.test', role: 'AGENT', tenantId: 't_prestige', tenantName: 'Prestige Group' },
  { id: 'u_cust_1', name: 'Rajesh Kumar', email: 'rajesh@email.com', role: 'CUSTOMER', phone: '+91 98765 43210' },
];

export const defaultAuthState = {
  currentUser: mockUsers[1], // Default to Admin - Soundarya Group
  isAuthenticated: true,
};
