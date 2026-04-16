import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Pyodide requires SharedArrayBuffer, which requires Cross-Origin Isolation.
// See: https://pyodide.org/en/stable/usage/index.html
function crossOriginIsolationPlugin(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), crossOriginIsolationPlugin()],
  worker: {
    format: 'es',
  },
})
