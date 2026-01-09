type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
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

const getBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!base) {
    throw new ApiError('Missing VITE_API_BASE_URL. Add it to frontend/.env');
  }
  return base.replace(/\/$/, '');
};

const buildUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${cleanPath}`;
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

async function requestRaw<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(buildUrl(path), {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await toJsonOrText(res);

  if (!res.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as any).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, { status: res.status, payload });
  }

  return payload as T;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestRaw<ApiEnvelope<T>>(method, path, body);
}

export const httpClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  rawGet: <T>(path: string) => requestRaw<T>('GET', path),
  rawPost: <T>(path: string, body: unknown) => requestRaw<T>('POST', path, body),
};
