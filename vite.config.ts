import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// index.html (first-paint shell, phone browser bar, favicon) uses {{--color-name}} placeholders filled from _colors.scss,
// so that file stays the only place a colour is written. `|url` encodes the value for use inside a data: URL.
function paletteInHtml(): Plugin {
  const file = fileURLToPath(new URL('./src/shared/styles/_colors.scss', import.meta.url))
  return {
    name: 'korner-palette-in-html',
    // 'pre': the colours must be in place before Vite processes the inline <style>.
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const colors = new Map([...readFileSync(file, 'utf8').matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]))
        return html.replace(/\{\{(--color-[\w-]+)(\|url)?\}\}/g, (_, name: string, url?: string) => {
          const value = colors.get(name)
          if (!value) throw new Error(`index.html uses ${name}, which is not in _colors.scss`)
          return url ? encodeURIComponent(value) : value
        })
      },
    },
  }
}

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
    plugins: [react(), paletteInHtml()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { proxy },
    // `npm run audit` measures a production build served locally, with the same /api forwarding.
    preview: { proxy },
  }
})
