import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gpuSupported, previewGpuOptions, readPreviewGpuPref, writePreviewGpuPref } from './gpu'

describe('previewGpuOptions', () => {
  it('maps the theme crt block like the terminal does', () => {
    expect(previewGpuOptions({ crt: {} }).scanlines).toBeCloseTo(0.504)
    const o = previewGpuOptions({ crt: { scanlines: 2, bloom: 5 }, palette: { fg: '#ffb000' } })
    expect(o).toEqual({ scanlines: 1, interference: 1, glare: 1, color: '#ffb000' })
  })

  it('falls back to green without a palette', () => {
    expect(previewGpuOptions({}).color).toBe('#33ff33')
  })
})

describe('preview GPU preference', () => {
  // Node 26 ships its own (disabled) localStorage global; stub a Map-backed one.
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v))
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('defaults to on and persists off', () => {
    expect(readPreviewGpuPref()).toBe(true)
    writePreviewGpuPref(false)
    expect(readPreviewGpuPref()).toBe(false)
  })

  it('jsdom has no WebGPU', () => {
    expect(gpuSupported()).toBe(false)
  })
})
