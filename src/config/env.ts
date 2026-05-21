/**
 * Frontend environment (Vite: set in .env, prefix with VITE_).
 * See .env.example in the project root.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
} as const;
