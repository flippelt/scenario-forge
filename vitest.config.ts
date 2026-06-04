import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts: the unit tests are plain TS (model +
// validation), so they need no React plugin — and importing the react plugin
// here would drag in the vite/vitest dual-type mismatch.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // rpgterm-engine ships untranspiled ESM source (bare .json imports). Vitest
    // skips node_modules by default; inline it so Vite transforms it like our
    // own code (handling the JSON imports without import attributes).
    server: { deps: { inline: [/rpgterm-engine/] } }
  }
})
