/**
 * Frontend environment (Vite: set in .env, prefix with VITE_).
 * Must include /api/v1 — e.g. https://gold-ledger-be.onrender.com/api/v1
 */
const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  if (!trimmed.endsWith('/api/v1')) {
    console.warn(
      '[MyLedger] VITE_API_URL should end with /api/v1. Got:',
      url,
      '→ using',
      `${trimmed}/api/v1`,
    );
    return `${trimmed}/api/v1`;
  }
  return trimmed;
}

const DEFAULT_API_TIMEOUT_MS = 30_000;
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 120_000;

function parseTimeoutMs(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(raw),
  /** Max wait for JSON API calls (ms). */
  apiTimeoutMs: parseTimeoutMs(import.meta.env.VITE_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
  /** Max wait for PDF / file downloads (ms). */
  downloadTimeoutMs: parseTimeoutMs(
    import.meta.env.VITE_API_DOWNLOAD_TIMEOUT_MS,
    DEFAULT_DOWNLOAD_TIMEOUT_MS,
  ),
} as const;
