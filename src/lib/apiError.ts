import { ApiClientError } from '../api/client';

/** User-facing message from API failures (validation field errors or message). */
export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof ApiClientError) {
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
