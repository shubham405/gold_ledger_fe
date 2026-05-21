import { clearAuth, getToken } from '../lib/authStorage';
import { env } from '../config/env';
import type { ApiError } from '../types';

const API_BASE = env.apiBaseUrl;

export class ApiClientError extends Error {
  status: number;
  body?: ApiError;

  constructor(status: number, message: string, body?: ApiError) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function messageFromErrorBody(body: ApiError | undefined, statusText: string): string {
  const fieldMap = body?.fieldErrors ?? body?.errors;
  if (fieldMap && Object.keys(fieldMap).length > 0) {
    return Object.values(fieldMap).filter(Boolean).join('; ');
  }
  return body?.message?.trim() || statusText || 'Request failed';
}

async function parseError(res: Response): Promise<ApiClientError> {
  let body: ApiError | undefined;
  try {
    body = await res.json();
  } catch {
    /* empty */
  }
  const message = messageFromErrorBody(body, res.statusText);
  return new ApiClientError(res.status, message, body);
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new ApiClientError(401, 'Session expired. Please sign in again.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json() as Promise<T>;
}
