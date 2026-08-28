import { describe, it, expect } from 'vitest'
import { packZip, unpackZip } from './zip'
import { projectFromEntries, importRepoZip } from './adapter'
import { toRepoFolder } from '../model/serialize'
import type { Project } from '../model/types'

const sample: Project = {
  theme: 'cprd',
  meta: { id: 'heimdall', name: 'HEIMDALL' },
  files: [{ path: '/intel/secomm.dat', content: 'SECRET', meta: { locked: true, password: '12345' } }],
  translations: { pt: { '/intel/secomm.dat': 'SEGREDO' } },
  dirPath: null
}

describe('zip pack/unpack', () => {
  it('round-trips nested paths and unicode', () => {
    const files = { 'scenario.json': '{"id":"x"}', 'files/café.md': '# Olá' }
    const back = unpackZip(packZip(files))
    expect(back).toEqual(files)
  })

  it('zip of a repo folder rehydrates the project (theme from scenario.json)', async () => {
    const { files } = toRepoFolder(sample)
    const project = await importRepoZip(packZip(files))
    expect(project.theme).toBe('cprd')
    expect(project.meta.id).toBe('heimdall')
    expect(project.meta.theme).toBeUndefined()
    expect(project.files[0]?.meta.password).toBe('12345')
    expect(project.translations.pt['/intel/secomm.dat']).toBe('SEGREDO')
  })

  it('zip prefixed with the folder name (macOS Compress) still opens', () => {
    const { files } = toRepoFolder(sample)
    const prefixed: Record<string, string> = {}
    for (const [path, content] of Object.entries(files)) {
      prefixed[`heimdall/${path}`] = content
    }
    const project = projectFromEntries(prefixed)
    expect(project.theme).toBe('cprd')
    expect(project.files).toHaveLength(1)
  })
})
