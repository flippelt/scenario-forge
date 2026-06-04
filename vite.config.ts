import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tauri expects a fixed port and ignores VITE_ env clobbering. The Rust shell
// loads http://localhost:1420 in dev; the web build (dist/) is what it bundles.
// Test config lives in vitest.config.ts to avoid the vite/vitest type clash.
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] }
  },
  build: {
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false
  }
})
