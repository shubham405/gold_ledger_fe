import { env } from '../config/env';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const AUTH_BASE = env.apiBaseUrl;

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithTimeout(`${AUTH_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* empty */
    }
    throw new Error(message || 'Request failed');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    authFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    authFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    authFetch<AuthResponse>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  forgotPassword: (email: string) =>
    authFetch<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    authFetch<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
};
