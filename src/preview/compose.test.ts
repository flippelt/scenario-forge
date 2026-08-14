import { describe, it, expect } from 'vitest'
import { runCommand, makeT } from 'rpgterm-engine'
import { composeProject } from './compose'
import type { Project } from '../model/types'

const sample: Project = {
  theme: 'ibm',
  meta: {
    id: 'tube',
    name: 'Tube',
    shortName: 'TEST-TUBE',
    crt: { scanlines: 0.5, plate: 'LAB 01' },
    motd: ['hello from forge']
  },
  files: [
    {
      path: '/readme.md',
      content: '# hi',
      meta: {}
    },
    {
      path: '/safe.dat',
      content: 'secret',
      meta: { locked: true, password: 'OPEN', crackable: false }
    }
  ],
  translations: {},
  dirPath: null
}

describe('in-process compose', () => {
  it('applies shortName from the project onto the composed theme', () => {
    const theme = composeProject(sample, 'en')
    expect(theme.shortName).toBe('TEST-TUBE')
    expect((theme.crt as { plate?: string }).plate).toBe('LAB 01')
    expect((theme.crt as { scanlines?: number }).scanlines).toBe(0.5)
  })

  it('runs engine commands against the composed filesystem', () => {
    const theme = composeProject(sample, 'en')
    const out = runCommand('ls', {
      theme,
      fs: theme.filesystem,
      cwd: '/',
      unlocked: new Set(),
      t: makeT('en')
    }) as { text?: string }[]
    const texts = out.map((l) => l.text ?? '')
    expect(texts.some((t) => t.includes('readme.md'))).toBe(true)
    expect(texts.some((t) => t.includes('safe.dat'))).toBe(true)
  })
})
