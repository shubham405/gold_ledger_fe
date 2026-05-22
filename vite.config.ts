import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Vercel/static hosts: serve the SPA shell for unknown paths (reload / deep links). */
function spaFallback404(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const index = join(outDir, 'index.html')
      if (existsSync(index)) {
        copyFileSync(index, join(outDir, '404.html'))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_DEV_PORT) || 5173
  const host = env.VITE_DEV_HOST?.trim() || true

  return {
    appType: 'spa',
    plugins: [react(), spaFallback404()],
    server: {
      host,
      port,
      strictPort: true,
    },
    preview: {
      host,
      port: Number(env.VITE_PREVIEW_PORT) || port,
      strictPort: true,
    },
  }
})
