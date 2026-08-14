import { describe, it, expect } from 'vitest'
import { compareVersions, ENGINE_VERSION } from './engineVersion'

describe('engine version badge', () => {
  it('exposes the installed rpgterm-engine version', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('flags drift when the published pin differs', () => {
    expect(compareVersions('0.2.1', '0.1.1').drift).toBe(true)
    expect(compareVersions('0.2.1', '^0.2.1').drift).toBe(false)
    expect(compareVersions('0.2.1', null).drift).toBe(false)
  })
})
