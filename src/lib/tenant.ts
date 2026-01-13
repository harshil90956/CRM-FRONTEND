import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useQuery } from '@tanstack/react-query';
import { publicProjectsService } from '@/api';

export function useResolvedTenantId(): string | null {
  const { currentUser, lastTenantId } = useAppStore();

  const tenantId = useMemo(() => {
    const fromUser = String((currentUser as any)?.tenantId || '').trim();
    if (fromUser) return fromUser;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search || '');
      const fromQuery = String(params.get('tenantId') || '').trim();
      if (fromQuery) return fromQuery;
    }

    const fromLast = String(lastTenantId || '').trim();
    if (fromLast) return fromLast;

    return null;
  }, [currentUser, lastTenantId]);

  return tenantId;
}

export function useResolvedTenantIdOrBootstrap(): string | null {
  const base = useResolvedTenantId();

  const { data: tenantRes } = useQuery({
    queryKey: ['publicTenant'],
    queryFn: () => publicProjectsService.resolveTenant(),
    enabled: !base,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
  });

  const boot = String((tenantRes as any)?.success ? (tenantRes as any)?.data?.tenantId : '').trim();
  return base || (boot || null);
}

export function useCommitTenantIdOnSuccess(tenantId: string | null, success: boolean, hasData: boolean): void {
  const { setLastTenantId } = useAppStore();

  useEffect(() => {
    if (!success) return;
    if (!hasData) return;
    const tid = String(tenantId || '').trim();
    if (!tid) return;
    setLastTenantId(tid);
  }, [success, hasData, tenantId, setLastTenantId]);
}
