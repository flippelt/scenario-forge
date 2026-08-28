import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves at /scenario-forge/ (BASE_PATH in the deploy workflow).
// Local `npm run dev` / `npm run build` stay at `/`.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173
  },
  build: {
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false
  }
})
