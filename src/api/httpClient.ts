type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type SoftCacheEntry<T> = {
  data: T;
  expiry: number;
};

const softCache = new Map<string, SoftCacheEntry<unknown>>();

export function getFromSoftCache<T>(key: string): T | null {
  try {
    const entry = softCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      softCache.delete(key);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export function setToSoftCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    const ttl = Number.isFinite(ttlMs) ? Math.max(0, Math.floor(ttlMs)) : 0;
    if (ttl <= 0) return;
    softCache.set(key, { data, expiry: Date.now() + ttl });
  } catch {
  }
}

export function clearSoftCache(): void {
  try {
    softCache.clear();
  } catch {
  }
}

const safeSerialize = (value: unknown): string => {
  if (value === undefined) return '';
  if (value === null) return 'null';

  const isFormData = typeof FormData !== 'undefined' && value instanceof FormData;
  if (isFormData) return '[formdata]';

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

export class ApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, opts?: { status?: number; payload?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts?.status;
    this.payload = opts?.payload;
  }
}

const inFlightRequests = new Map<string, Promise<unknown>>();

const getBaseUrl = (): string => {
  const base = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (!base) {
    return '';
  }
  return base.replace(/\/$/, '');
};

const buildUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getBaseUrl();
  if (!base) return cleanPath;
  return `${base}${cleanPath}`;
};

const toJsonOrText = async (res: Response): Promise<unknown> => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
};

const getAccessToken = (): string | null => {
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
  localStorage.removeItem('crm_currentUser');
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  window.location.replace('/login');
};

async function requestRaw<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const token = getAccessToken();

  const key = `${method}:${path}:${token ? token.trim() : ''}:${safeSerialize(body)}`;
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {

  const isFormData =
    typeof FormData !== 'undefined' &&
    body !== undefined &&
    body !== null &&
    body instanceof FormData;

  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  if (body !== undefined && !isFormData) {
    headers['content-type'] = 'application/json';
  }

  const requestBody: any =
    body === undefined ? undefined : isFormData ? (body as any) : JSON.stringify(body);

    const res = await fetch(buildUrl(path), {
      method,
      headers,
      body: requestBody,
    });

    const payload = await toJsonOrText(res);

    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        redirectToLogin();
      }

      const message =
        typeof payload === 'object' && payload && 'message' in payload
          ? String((payload as any).message)
          : `Request failed (${res.status})`;
      throw new ApiError(message, { status: res.status, payload });
    }

    if (method !== 'GET') {
      clearSoftCache();
    }

    return payload as T;
  })();

  inFlightRequests.set(key, promise as Promise<unknown>);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(key);
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestRaw<ApiEnvelope<T>>(method, path, body);
}

export const httpClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  rawGet: <T>(path: string) => requestRaw<T>('GET', path),
  rawPost: <T>(path: string, body: unknown) => requestRaw<T>('POST', path, body),
};
