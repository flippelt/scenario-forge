// Realistic full-scenario round-trip: the on-disk repo-folder format the
// terminal actually uses (scenario.json + files/ + files.<lang>/), with the
// fiddly bits that have bitten before — a numeric-only password (must stay a
// string), nested directories, every flag group, multiple translations, and a
// scenario.json carrying tracer/dialog/events. If the editor's folder
// serialization loses or mangles any of this, this test fails. This is the
// guard for the desktop Open/Save-folder path (whose Tauri dialog half can't be
// unit-tested, but whose serializer half is exactly this).

import { describe, it, expect } from 'vitest'
import { composeCustomScenario } from 'rpgterm-engine'
import { toRepoFolder, fromRepoFolder, toRuntimeBundle, fromRuntimeBundle } from './serialize'
import type { Project } from './types'

const scenario: Project = {
  theme: 'cprd',
  meta: {
    id: 'heimdall',
    name: 'Caso 4127-A — Projeto HEIMDALL',
    header: 'NETWATCH // NIGHT CITY',
    prompt: 'netwatch',
    user: 'agent',
    motd: ['// Console NetWatch //', '', 'tente: cat case.md, check intel/secomm.dat'],
    checkMisleadsOnFail: true,
    tracer: { seconds: 30, penalty: 7, startAfter: 1, nocrackSeconds: 3, label: 'ICE TRACE' },
    dialog: {
      thinking: ['ACESSANDO...'],
      fallback: 'REGISTRO NÃO ENCONTRADO.',
      responses: [{ match: ['arasaka', 'torre'], type: 'err', lines: ['DADOS SELADOS.'] }]
    },
    events: {
      '/blackbox.dat': [
        { text: '>>> LEITURA NÃO AUTORIZADA', type: 'err' },
        { type: 'countdown', from: 5, interval: 700, label: 'RASTREIO EM', alarm: true }
      ]
    }
  },
  files: [
    { path: '/case.md', content: '# Caso 4127-A\n\nIncursão ilegal na **Torre Arasaka**.', meta: {} },
    {
      path: '/intel/secomm.dat',
      content: 'INTERCEPTAÇÃO\n=============\nfrequência militar.',
      meta: { locked: true, crackDC: 15, crackAttempts: 3, checkDC: 12, tracer: true, tracerSeconds: 20 }
    },
    {
      path: '/blackbox.dat',
      content: 'OPERAÇÃO PHARMAKOS\narmadilha controlada.',
      // numeric-only password must round-trip as a STRING, not the number 12345
      meta: { locked: true, password: '12345', crackable: false, tracer: true, reveals: '/intel/secomm.dat' }
    }
  ],
  translations: {
    pt: { '/case.md': '# Caso 4127-A\n\nIncursão ilegal na **Torre Arasaka** (pt).' },
    en: { '/case.md': '# Case 4127-A\n\nIllegal incursion at **Arasaka Tower**.' }
  },
  dirPath: null
}

describe('repo-folder round-trip (Open/Save pasta)', () => {
  it('to -> from preserva meta, arquivos e traduções de um cenário completo', () => {
    const { files, suggestedDir } = toRepoFolder(scenario)
    expect(suggestedDir).toBe('cprd/heimdall')
    expect(files['scenario.json']).toBeDefined()
    expect(files['files/intel/secomm.dat']).toContain('crackDC: 15') // dir aninhado preservado
    expect(files['files.pt/case.md']).toContain('(pt)')
    expect(files['files.en/case.md']).toContain('Arasaka Tower')

    const back = fromRepoFolder(files, 'cprd')
    expect(back.files).toEqual(scenario.files)
    expect(back.translations).toEqual(scenario.translations)
    expect(back.meta).toEqual(scenario.meta)
  })

  it('senha só-numérica continua string (não vira número) no .dat', () => {
    const { files } = toRepoFolder(scenario)
    expect(files['files/blackbox.dat']).toContain('password: "12345"')
    const back = fromRepoFolder(files, 'cprd')
    const bb = back.files.find((f) => f.path === '/blackbox.dat')!
    expect(bb.meta.password).toBe('12345')
    expect(typeof bb.meta.password).toBe('string')
  })

  it('o cenário (re)composto pelo engine real lê os flags certos', () => {
    const theme = composeCustomScenario(toRuntimeBundle(scenario) as Record<string, unknown>) as {
      filesystem: Record<string, Record<string, unknown>>
    }
    const secomm = theme.filesystem['/intel/secomm.dat']
    expect(secomm.crackDC).toBe(15)
    expect(secomm.checkDC).toBe(12)
    const bb = theme.filesystem['/blackbox.dat']
    expect(bb.password).toBe('12345')
    expect(bb.crackable).toBe(false)
  })

  it('bundle runtime também faz round-trip do cenário completo', () => {
    const back = fromRuntimeBundle(toRuntimeBundle(scenario))
    expect(back.files).toEqual(scenario.files)
    expect(back.translations).toEqual(scenario.translations)
    expect(back.meta.events).toEqual(scenario.meta.events)
    expect(back.meta.tracer).toEqual(scenario.meta.tracer)
  })
})
