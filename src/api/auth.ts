import { env } from '../config/env';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const AUTH_BASE = env.apiBaseUrl;

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
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
};
