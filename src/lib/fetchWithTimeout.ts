import { env } from '../config/env';

export class RequestTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    const seconds = Math.round(timeoutMs / 1000);
    super(`Request timed out after ${seconds}s. Check your connection or try again.`);
    this.name = 'RequestTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * fetch() with an AbortSignal deadline so the UI does not hang indefinitely.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = env.apiTimeoutMs,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (isAbortError(err)) {
      throw new RequestTimeoutError(timeoutMs);
    }
    if (err instanceof TypeError) {
      throw new Error('Cannot reach the server. Check your network or API URL.');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}
