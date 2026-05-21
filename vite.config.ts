import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_DEV_PORT) || 5173
  const host = env.VITE_DEV_HOST?.trim() || true

  return {
    plugins: [react()],
    server: {
      host,
      port,
    },
  }
})
