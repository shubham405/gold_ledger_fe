import { env } from '../config/env';
import { clearAuth, getToken } from '../lib/authStorage';
import { ApiClientError } from './client';

const API_BASE = env.apiBaseUrl;

async function parseDownloadError(res: Response): Promise<ApiClientError> {
  let message = res.statusText;
  try {
    const body = await res.json();
    if (body?.message) {
      message = body.message;
    }
  } catch {
    /* binary or empty */
  }
  return new ApiClientError(res.status, message || 'Download failed');
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new ApiClientError(401, 'Session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw await parseDownloadError(res);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
