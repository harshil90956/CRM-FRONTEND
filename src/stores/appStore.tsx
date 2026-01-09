import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { httpClient } from '@/api/httpClient';
import { tenants as defaultTenants, leads as defaultLeads, projects as defaultProjects, units as defaultUnits, agents as defaultAgents, payments as defaultPayments } from '@/data/mockData';

export type AuthRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  tenantId: string;
};

interface Tenant {
  id: number | string;
  name: string;
  email: string;
  domain?: string;
  projects: number;
  users: number;
  subscription: string;
  status: string;
  revenue: string;
}

interface AppState {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  sendOtp: (email: string) => Promise<void>;
  login: (email: string, otp: string) => Promise<CurrentUser | null>;
  logout: () => void;
  updateCurrentUser: (data: Partial<CurrentUser>) => void;
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<Tenant>;
  updateTenant: (id: string | number, data: Partial<Tenant>) => void;
  goals: { monthlyTarget: number; leadsTarget: number; conversionsTarget: number };
  setGoals: (goals: Partial<AppState['goals']>) => void;
  dateRange: number;
  setDateRange: (days: number) => void;
  leads: any[];
  addLeads: (newLeads: any[]) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>(defaultTenants);
  const [goals, setGoalsState] = useState({ monthlyTarget: 100, leadsTarget: 200, conversionsTarget: 25 });
  const [dateRange, setDateRange] = useState(30);
  const [leads, setLeads] = useState(defaultLeads);
  const [isLoading, setIsLoading] = useState(false);

  const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const keys = ['crm_accessToken', 'accessToken', 'token'];

    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }

    for (const k of keys) {
      const v = sessionStorage.getItem(k);
      if (v) return v;
    }

    return null;
  };

  const clearStoredToken = () => {
    if (typeof window === 'undefined') return;
    const keys = ['crm_accessToken', 'accessToken', 'token'];
    for (const k of keys) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  };

  React.useEffect(() => {
    void (async () => {
      if (typeof window === 'undefined') return;
      const token = getStoredToken();
      if (!token) return;

      try {
        const me = await httpClient.rawGet<CurrentUser>('/auth/me');
        setCurrentUser(me);
        setIsAuthenticated(true);
      } catch {
        clearStoredToken();
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAuthenticated && currentUser) {
      localStorage.setItem('crm_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('crm_currentUser');
    }
  }, [currentUser, isAuthenticated]);

  const sendOtp = useCallback(async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await httpClient.post<unknown>('/auth/send-otp', { email });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, otp: string): Promise<CurrentUser | null> => {
    setIsLoading(true);
    try {
      const res = await httpClient.rawPost<any>('/auth/verify-otp', {
        email,
        otp,
      });

      const accessToken: string | undefined = res?.accessToken ?? res?.data?.accessToken;
      const user: CurrentUser | undefined = res?.user ?? res?.data?.user;

      if (!accessToken || !user?.id) {
        return null;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_accessToken', accessToken);
        sessionStorage.setItem('crm_accessToken', accessToken);
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      clearStoredToken();
      localStorage.removeItem('crm_currentUser');
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateCurrentUser = useCallback((data: Partial<CurrentUser>) => {
    setCurrentUser(prev => prev ? ({ ...prev, ...data }) : prev);
  }, []);

  const addTenant = useCallback(async (tenant: Omit<Tenant, 'id'>): Promise<Tenant> => {
    setIsLoading(true);
    const newTenant: Tenant = { ...tenant, id: `t_${Date.now()}` };
    setTenants(prev => [...prev, newTenant]);
    setIsLoading(false);
    return newTenant;
  }, []);

  const updateTenant = useCallback((id: string | number, data: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const setGoals = useCallback((newGoals: Partial<AppState['goals']>) => {
    setGoalsState(prev => ({ ...prev, ...newGoals }));
  }, []);

  const addLeads = useCallback((newLeads: any[]) => {
    setLeads(prev => [...prev, ...newLeads]);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, isAuthenticated, sendOtp, login, logout,
      updateCurrentUser,
      tenants, addTenant, updateTenant, goals, setGoals,
      dateRange, setDateRange, leads, addLeads, isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
