import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { httpClient } from '@/api/httpClient';

export type AuthRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';

export type AccountStatus = 'LEGACY' | 'INVITED' | 'ACTIVE' | 'SUSPENDED';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  designation?: string | null;
  role: AuthRole;
  tenantId: string;
  accountStatus?: AccountStatus;
  needsPasswordSetup?: boolean;
};

export type PublicPlatformSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
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
  authChecked: boolean;
  lastTenantId: string | null;
  setLastTenantId: (id: string | null) => void;
  sendOtp: (email: string) => Promise<void>;
  login: (email: string, otp: string, role: AuthRole, tenantId?: string | null) => Promise<CurrentUser | null>;
  loginWithPassword: (email: string, password: string) => Promise<CurrentUser | null>;
  refreshMe: () => Promise<void>;
  setPassword: (verificationToken: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  requestPurposeOtp: (email: string, purpose: 'PASSWORD_RESET' | 'ACCOUNT_ACTIVATION') => Promise<void>;
  verifyPurposeOtp: (email: string, otp: string, purpose: 'PASSWORD_RESET' | 'ACCOUNT_ACTIVATION') => Promise<string>;
  resetPassword: (verificationToken: string, newPassword: string) => Promise<void>;
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

  publicPlatformSettings: PublicPlatformSettings | null;
  refreshPublicPlatformSettings: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [lastTenantId, setLastTenantIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('crm_lastSuccessfulTenantId_v2');
    const v = String(raw || '').trim();
    return v || null;
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [goals, setGoalsState] = useState({ monthlyTarget: 100, leadsTarget: 200, conversionsTarget: 25 });
  const [dateRange, setDateRange] = useState(30);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [publicPlatformSettings, setPublicPlatformSettings] = useState<PublicPlatformSettings | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('crm_public_platform_settings');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as any;
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        platformName: String(parsed.platformName || 'RealCRM'),
        supportEmail: String(parsed.supportEmail || 'support@realcrm.com'),
        maintenanceMode: Boolean(parsed.maintenanceMode),
      };
    } catch {
      return null;
    }
  });

  const storeVerificationToken = (token: string | undefined) => {
    if (typeof window === 'undefined') return;
    const v = String(token || '').trim();
    if (!v) return;
    sessionStorage.setItem('crm_verificationToken', v);
    localStorage.setItem('crm_verificationToken', v);
  };

  const clearVerificationToken = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('crm_verificationToken');
    localStorage.removeItem('crm_verificationToken');
  };

  const refreshMe = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const me = await httpClient.rawGet<CurrentUser>('/auth/me');
      setCurrentUser(me);
      setIsAuthenticated(true);
    } catch {
      // handled by httpClient redirect on 401
    }
  }, []);

  const refreshPublicPlatformSettings = useCallback(async (): Promise<void> => {
    try {
      const res = await httpClient.get<PublicPlatformSettings>('/public/settings');
      if (!res?.success || !res?.data) return;
      setPublicPlatformSettings(res.data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_public_platform_settings', JSON.stringify(res.data));
      }
    } catch {
    }
  }, []);

  const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const keys = ['crm_accessToken', 'auth_token', 'accessToken', 'token'];

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
    const keys = ['crm_accessToken', 'auth_token', 'accessToken', 'token'];
    for (const k of keys) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  };

  React.useEffect(() => {
    void (async () => {
      if (typeof window === 'undefined') return;
      const token = getStoredToken();
      if (!token) {
        setAuthChecked(true);
        return;
      }

      try {
        const me = await httpClient.rawGet<CurrentUser>('/auth/me');
        setCurrentUser(me);
        setIsAuthenticated(true);
      } catch {
        if (getStoredToken() === token) {
          clearStoredToken();
        }
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    void refreshPublicPlatformSettings();
    const id = setInterval(() => {
      void refreshPublicPlatformSettings();
    }, 60_000);
    return () => clearInterval(id);
  }, [refreshPublicPlatformSettings]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAuthenticated && currentUser) {
      localStorage.setItem('crm_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('crm_currentUser');
    }
  }, [currentUser, isAuthenticated]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (lastTenantId) {
      localStorage.setItem('crm_lastSuccessfulTenantId_v2', lastTenantId);
      localStorage.removeItem('crm_lastTenantId');
    } else {
      localStorage.removeItem('crm_lastSuccessfulTenantId_v2');
    }
  }, [lastTenantId]);

  const setLastTenantId = useCallback((id: string | null) => {
    const next = String(id || '').trim();
    setLastTenantIdState(next || null);
  }, []);

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

  const login = useCallback(async (email: string, otp: string, role: AuthRole, tenantId?: string | null): Promise<CurrentUser | null> => {
    setIsLoading(true);
    try {
      const payload: any = { email, otp, role };
      const tid = String(tenantId || '').trim();
      if (tid) payload.tenantId = tid;

      const res = await httpClient.rawPost<any>('/auth/verify-otp', payload);

      const accessToken: string | undefined = res?.accessToken ?? res?.data?.accessToken;
      const user: CurrentUser | undefined = res?.user ?? res?.data?.user;
      const verificationToken: string | undefined = res?.verificationToken ?? res?.data?.verificationToken;
      const needsPasswordSetup: boolean = Boolean(res?.needsPasswordSetup ?? res?.data?.needsPasswordSetup ?? user?.needsPasswordSetup);

      if (!accessToken || !user?.id) {
        return null;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_accessToken', accessToken);
        sessionStorage.setItem('crm_accessToken', accessToken);
        localStorage.setItem('auth_token', accessToken);
        sessionStorage.setItem('auth_token', accessToken);
      }

      if (verificationToken) {
        storeVerificationToken(verificationToken);
      }

      const shaped: CurrentUser = { ...user, needsPasswordSetup };
      setCurrentUser(shaped);
      setIsAuthenticated(true);
      return shaped;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      throw new Error(msg || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string): Promise<CurrentUser | null> => {
    setIsLoading(true);
    try {
      const res = await httpClient.rawPost<any>('/auth/login', { email, password });
      const accessToken: string | undefined = res?.accessToken ?? res?.data?.accessToken;
      const user: CurrentUser | undefined = res?.user ?? res?.data?.user;
      if (!accessToken || !user?.id) return null;

      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_accessToken', accessToken);
        sessionStorage.setItem('crm_accessToken', accessToken);
        localStorage.setItem('auth_token', accessToken);
        sessionStorage.setItem('auth_token', accessToken);
      }
      clearVerificationToken();
      setCurrentUser({ ...user, needsPasswordSetup: false });
      setIsAuthenticated(true);
      return user;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      throw new Error(msg || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPassword = useCallback(async (verificationToken: string, password: string): Promise<void> => {
    const token = String(verificationToken || '').trim();
    if (!token) throw new Error('Missing verification token');
    const res = await httpClient.post<any>('/auth/set-password', { verificationToken: token, password });
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to set password');
    }
    clearVerificationToken();
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    const res = await httpClient.post<any>('/auth/forgot-password', { email });
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to send OTP');
    }
  }, []);

  const requestPurposeOtp = useCallback(async (email: string, purpose: 'PASSWORD_RESET' | 'ACCOUNT_ACTIVATION'): Promise<void> => {
    const res = await httpClient.post<any>('/auth/request-otp', { email, purpose });
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to send OTP');
    }
  }, []);

  const verifyPurposeOtp = useCallback(async (email: string, otp: string, purpose: 'PASSWORD_RESET' | 'ACCOUNT_ACTIVATION'): Promise<string> => {
    const res = await httpClient.rawPost<any>('/auth/verify-otp', { email, otp, purpose });
    const token = String(res?.verificationToken ?? res?.data?.verificationToken ?? '').trim();
    if (!token) {
      throw new Error('Failed to verify OTP');
    }
    return token;
  }, []);

  const resetPassword = useCallback(async (verificationToken: string, newPassword: string): Promise<void> => {
    const token = String(verificationToken || '').trim();
    if (!token) throw new Error('Missing verification token');
    const res = await httpClient.post<any>('/auth/reset-password', { verificationToken: token, newPassword });
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to reset password');
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      clearStoredToken();
      localStorage.removeItem('crm_currentUser');
    }
    clearVerificationToken();
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
      currentUser, isAuthenticated, authChecked, sendOtp, login, logout,
      loginWithPassword,
      refreshMe,
      setPassword,
      forgotPassword,
      requestPurposeOtp,
      verifyPurposeOtp,
      resetPassword,
      lastTenantId, setLastTenantId,
      updateCurrentUser,
      tenants, addTenant, updateTenant, goals, setGoals,
      dateRange, setDateRange, leads, addLeads, isLoading,
      publicPlatformSettings, refreshPublicPlatformSettings,
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
