// Anti-divergence guarantee: the editor's serializers must produce exactly what
// the real terminal engine reads. We import the ACTUAL engine (rpgterm-engine,
// the same code the terminal runs) and assert that a bundle exported by
// scenario-forge, when composed by the engine, yields the flags we set — and
// that both front-matter parsers agree byte-for-byte. If the engine changes its
// schema, this test breaks, telling us to update the editor.
import { describe, it, expect } from 'vitest'
import {
  parseFrontMatter as enginePFM,
  composeCustomScenario,
  runCommand,
  makeT,
  encodeBundle
} from 'rpgterm-engine'
import { parseFrontMatter as editorPFM, serializeFrontMatter } from './frontmatter'
import { importShareLink } from '../fs/adapter'
import { toRuntimeBundle } from './serialize'
import type { Project } from './types'

const sample: Project = {
  theme: 'cprd',
  meta: { id: 'heimdall', name: 'Case 4127-A', tracer: { seconds: 30 } },
  files: [
    { path: '/case.md', content: '# Case', meta: {} },
    {
      path: '/intel/blackbox.dat',
      content: 'segredo',
      meta: {
        locked: true,
        password: 'OPERATION-PHARMAKOS',
        crackable: false,
        crackDC: 18,
        tracer: true,
        tracerSeconds: 20
      }
    }
  ],
  translations: { pt: { '/case.md': '# Caso' } },
  dirPath: null
}

describe('schema parity with the real engine', () => {
  it('editor and engine front-matter parsers agree', () => {
    const raw = serializeFrontMatter(
      { locked: true, password: '12345', crackDC: 15, tracer: true },
      'corpo'
    )
    expect(enginePFM(raw)).toEqual(editorPFM(raw))
  })

  it('engine composes the bundle and reads back the exact flags the editor set', () => {
    const bundle = toRuntimeBundle(sample)
    const theme = composeCustomScenario(bundle as Record<string, unknown>) as {
      filesystem: Record<string, Record<string, unknown>>
      scenarioId: string
      theme?: string
    }
    const node = theme.filesystem['/intel/blackbox.dat']
    expect(node.type).toBe('file')
    expect(node.locked).toBe(true)
    expect(node.password).toBe('OPERATION-PHARMAKOS')
    expect(node.crackable).toBe(false)
    expect(node.crackDC).toBe(18)
    expect(node.tracer).toBe(true)
    expect(node.tracerSeconds).toBe(20)
    expect(node.content).toBe('segredo')
    expect(theme.scenarioId).toBe('heimdall')
  })

  it('engine applies the directory translation from the bundle i18n', () => {
    const bundle = toRuntimeBundle(sample)
    const theme = composeCustomScenario(bundle as Record<string, unknown>, 'pt') as {
      filesystem: Record<string, Record<string, unknown>>
    }
    expect(theme.filesystem['/case.md'].content).toBe('# Caso')
  })

  it('a dialog edited in the editor drives the engine `query` command', () => {
    const p: Project = {
      theme: 'alien',
      meta: {
        id: 'muthur',
        dialog: {
          fallback: 'REGISTRO NÃO ENCONTRADO.',
          responses: [{ match: ['nostromo', 'nave'], lines: ['Cargueiro classe M, registro 180924609.'] }]
        }
      },
      files: [],
      translations: {},
      dirPath: null
    }
    const theme = composeCustomScenario(toRuntimeBundle(p) as Record<string, unknown>) as {
      filesystem?: Record<string, unknown>
    }
    const out = runCommand('query nostromo', {
      theme,
      fs: theme.filesystem ?? {},
      cwd: '/',
      unlocked: new Set(),
      t: makeT('en')
    }) as { text?: string }[]
    expect(out.some((l) => (l.text ?? '').includes('Cargueiro classe M'))).toBe(true)
  })

  it('importShareLink decodifica um ?scenario64= de volta ao projeto', () => {
    const token = encodeBundle(toRuntimeBundle(sample))
    const back = importShareLink(`https://exemplo/?scenario64=${token}&x=1`)
    expect(back.theme).toBe(sample.theme)
    expect(back.files).toEqual(sample.files)
    expect(back.translations).toEqual(sample.translations)
    // também aceita o token cru, sem URL
    expect(importShareLink(token).meta.id).toBe(sample.meta.id)
  })
})
