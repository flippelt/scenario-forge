import type { CrtOverlayOptions } from 'rpg-prop-kit'

// Same mapping as Immersive-Terminal-for-RPGs (src/crt/gpuOptions.js), so
// the preview shows what the terminal will show with the GPU on.
const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function previewGpuOptions(theme: Record<string, unknown>): CrtOverlayOptions {
  const crt = (theme.crt ?? {}) as Record<string, unknown>
  const p = (theme.palette ?? {}) as Record<string, unknown>
  const bloom = num(crt.bloom, 1)
  return {
    scanlines: clamp01(num(crt.scanlines, 0.28) * 1.8),
    interference: clamp01(0.3 * bloom),
    glare: clamp01(0.3 * bloom),
    color: typeof p.fg === 'string' ? p.fg : '#33ff33'
  }
}

const KEY = 'forge.previewGpu'

export function gpuSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function readPreviewGpuPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

export function writePreviewGpuPref(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // storage unavailable — choice still applies for the session
  }
}
