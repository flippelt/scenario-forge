import { describe, it, expect } from 'vitest'
import { parseFrontMatter, serializeFrontMatter } from './frontmatter'
import { buildVfs } from './vfs'
import {
  toRuntimeBundle,
  fromRuntimeBundle,
  toRepoFolder,
  fromRepoFolder
} from './serialize'
import { validateProject } from '../validation/rules'
import type { Project } from './types'

// A real-shaped .dat, mirroring ibm/workstation/files/vault.dat.
const VAULT = `---
locked: true
password: BLACKSITE-NINE
crackable: false
tracer: true
crackFailMessage: vault.dat: hardened encryption. brute force will not work. key required.
decryptLabel: OPENING THE VAULT
---
VAULT // EYES ONLY
==================
Site 9 is real.`

describe('frontmatter parser (engine fidelity)', () => {
  it('coerces bool/number and keeps strings', () => {
    const { meta, content } = parseFrontMatter(VAULT)
    expect(meta.locked).toBe(true)
    expect(meta.crackable).toBe(false)
    expect(meta.tracer).toBe(true)
    expect(meta.password).toBe('BLACKSITE-NINE')
    expect(meta.decryptLabel).toBe('OPENING THE VAULT')
    expect(content.startsWith('VAULT // EYES ONLY')).toBe(true)
  })

  it('a plain file (no block) parses to empty meta', () => {
    const { meta, content } = parseFrontMatter('just text\nmore')
    expect(meta).toEqual({})
    expect(content).toBe('just text\nmore')
  })

  it('forces a string for numeric-only and boolean-like values via quotes', () => {
    const raw = serializeFrontMatter({ password: '12345', note: 'true' }, 'body')
    expect(raw).toContain('password: "12345"')
    expect(raw).toContain('note: "true"')
    const { meta } = parseFrontMatter(raw)
    expect(meta.password).toBe('12345') // stays a string, not 12345
    expect(meta.note).toBe('true')
  })

  it('round-trips meta + content losslessly', () => {
    const { meta, content } = parseFrontMatter(VAULT)
    const round = parseFrontMatter(serializeFrontMatter(meta, content))
    expect(round.meta).toEqual(meta)
    expect(round.content).toBe(content)
  })
})

describe('buildVfs (engine fidelity)', () => {
  it('infers dirs, sorts children, merges meta into file nodes', () => {
    const fs = buildVfs([
      { path: '/intel/secomm.dat', content: 'x', meta: { locked: true, crackDC: 15 } },
      { path: '/case.md', content: 'hello', meta: {} }
    ])
    expect(fs['/'].type).toBe('dir')
    expect((fs['/'] as { children: string[] }).children).toEqual(['case.md', 'intel'])
    expect(fs['/intel'].type).toBe('dir')
    const node = fs['/intel/secomm.dat'] as Record<string, unknown>
    expect(node.type).toBe('file')
    expect(node.locked).toBe(true)
    expect(node.crackDC).toBe(15)
  })
})

const sample: Project = {
  theme: 'cprd',
  meta: {
    id: 'heimdall',
    name: 'Case 4127-A',
    motd: ['line one', 'line two'],
    tracer: { seconds: 30, label: 'ICE TRACE' },
    checkMisleadsOnFail: true
  },
  files: [
    { path: '/case.md', content: '# Case', meta: {} },
    {
      path: '/blackbox.dat',
      content: 'secret',
      meta: { locked: true, password: 'OPERATION-PHARMAKOS', crackable: false, tracer: true }
    }
  ],
  translations: { pt: { '/case.md': '# Caso' } },
  dirPath: null
}

describe('serialize round-trips', () => {
  it('runtime bundle: to -> from is identity for files/meta/theme/translations', () => {
    const back = fromRuntimeBundle(toRuntimeBundle(sample))
    expect(back.theme).toBe('cprd')
    expect(back.files).toEqual(sample.files)
    expect(back.translations).toEqual(sample.translations)
    expect(back.meta.id).toBe('heimdall')
    expect(back.meta.checkMisleadsOnFail).toBe(true)
    expect(back.meta.tracer).toEqual({ seconds: 30, label: 'ICE TRACE' })
  })

  it('repo folder: to -> from is identity for files/meta/translations', () => {
    const { files } = toRepoFolder(sample)
    expect(files['scenario.json']).toBeDefined()
    expect(files['files/blackbox.dat']).toContain('password: OPERATION-PHARMAKOS')
    expect(files['files.pt/case.md']).toBe('# Caso')
    const back = fromRepoFolder(files, 'cprd')
    expect(back.files).toEqual(sample.files)
    expect(back.translations).toEqual(sample.translations)
    expect(back.meta.id).toBe('heimdall')
  })

  it('runtime bundle carries theme + files map the engine reads', () => {
    const bundle = toRuntimeBundle(sample) as Record<string, unknown>
    expect(bundle.theme).toBe('cprd')
    const f = bundle.files as Record<string, string>
    expect(f['/blackbox.dat']).toContain('locked: true')
    expect((bundle.i18n as Record<string, { files: Record<string, string> }>).pt.files['/case.md']).toBe('# Caso')
  })
})

describe('validation', () => {
  it('flags a watched file with no scenario tracer block', () => {
    const p: Project = {
      ...sample,
      meta: { id: 'x' }, // no tracer block
      translations: {}
    }
    const issues = validateProject(p)
    expect(issues.some((i) => i.message.includes('tracer'))).toBe(true)
  })

  it('errors on a locked file nobody can open', () => {
    const p: Project = {
      theme: 'ibm',
      meta: { id: 'x' },
      files: [{ path: '/dead.dat', content: '', meta: { locked: true, crackable: false, decryptGame: false } }],
      translations: {},
      dirPath: null
    }
    const issues = validateProject(p)
    expect(issues.some((i) => i.severity === 'error')).toBe(true)
  })

  it('passes a sane lockable file', () => {
    const p: Project = {
      theme: 'ibm',
      meta: { id: 'x' },
      files: [{ path: '/a.dat', content: 'hi', meta: { locked: true, password: 'KEY' } }],
      translations: {},
      dirPath: null
    }
    const errors = validateProject(p).filter((i) => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })
})
