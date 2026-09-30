import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// In development the browser calls /api on the dev server, which forwards to the real API (no CORS needed locally).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'https://korner.runasp.net',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { proxy },
    // `npm run audit` measures a production build served locally, with the same /api forwarding.
    preview: { proxy },
  }
})
