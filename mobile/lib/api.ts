import * as SecureStore from 'expo-secure-store';

/**
 * Client for the PASA Spring Boot API.
 *
 * Tokens are kept in the device's secure storage. Every request carries the access token;
 * if the API answers 401 the client exchanges the refresh token once and retries.
 *
 * Set EXPO_PUBLIC_API_URL to the backend origin, e.g. https://api.example.com (no trailing slash).
 */
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const ACCESS_KEY = 'pasa.access';
const REFRESH_KEY = 'pasa.refresh';

/** False when EXPO_PUBLIC_API_URL is not set, so callers can skip the API instead of failing. */
export const apiConfigured = API_URL.length > 0;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** A message that is safe to show a user for any failure from apiRequest. */
export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Your session has expired. Please sign out and sign in again.';
    if (e.status === 0) return 'The server address is not set up on this build of the app.';
    return e.message;
  }
  return 'Could not reach the server. Check your connection and try again.';
}

interface TokenResponse {
  token: string;
  userId: string;
  role: string;
  refreshToken: string | null;
}

async function saveTokens(t: { token: string; refreshToken?: string | null }): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, t.token);
  if (t.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken);
}

export async function clearApiSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function hasApiSession(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ACCESS_KEY)) !== null;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? body?.error ?? res.statusText;
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

/** Sign in with one form for parents and school staff. Stores the tokens on success. */
export async function apiSignIn(email: string, password: string): Promise<TokenResponse> {
  if (!apiConfigured) throw new ApiError(0, 'API address is not configured');
  const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  const data = (await res.json()) as TokenResponse;
  await saveTokens(data);
  return data;
}

// One refresh at a time: parallel 401s share the same attempt.
let refreshing: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return false;
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // 401 means the refresh token itself is no longer good: the session is over.
        if (res.status === 401) await clearApiSession();
        return false;
      }
      await saveTokens((await res.json()) as TokenResponse);
      return true;
    } catch {
      return false; // offline or server down: keep the tokens and let the caller see the failure
    }
  })();
  const current = refreshing;
  current.finally(() => {
    if (refreshing === current) refreshing = null;
  });
  return current;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serialised unless it is FormData. */
  body?: unknown;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  if (!apiConfigured) throw new ApiError(0, 'API address is not configured');

  const headers: Record<string, string> = {};
  const token = await SecureStore.getItemAsync(ACCESS_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | FormData | undefined;
  if (options.body instanceof FormData) {
    body = options.body; // fetch sets the multipart boundary itself
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body });

  if (res.status === 401 && !isRetry && (await refreshAccessToken())) {
    return apiRequest<T>(path, options, true);
  }
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
