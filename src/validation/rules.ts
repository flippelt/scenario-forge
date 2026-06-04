// Cross-field consistency checks, derived from how the engine actually reads
// the flags (commands.js). The goal is to catch "this won't do what you think"
// before export: a watched file with no tracer block, a hardened file nobody
// can open, a flag set on the wrong kind of file, an orphan translation.

import type { Project, FileMeta } from '../model/types'

export type Severity = 'error' | 'warn'

export interface Issue {
  severity: Severity
  /** What it concerns, for grouping in the panel. */
  scope: 'scenario' | 'file' | 'i18n'
  path?: string
  message: string
}

const has = (m: FileMeta, k: string) => m[k] != null && m[k] !== ''

function checkFile(path: string, m: FileMeta, allPaths: Set<string>): Issue[] {
  const out: Issue[] = []
  const locked = m.locked === true
  const file = (severity: Severity, message: string): Issue => ({
    severity,
    scope: 'file',
    path,
    message
  })

  // Flags that only do something on a locked file.
  const lockOnly = [
    'password', 'crackable', 'crackDC', 'crackAttempts', 'crackTime',
    'lockLabel', 'crackFailMessage', 'crackSuccessMessage', 'decryptGame',
    'decryptTarget', 'decryptLabel', 'decryptTime', 'tracer', 'checkDC'
  ]
  if (!locked) {
    for (const k of lockOnly) {
      if (m[k] != null) out.push(file('warn', `\`${k}\` não tem efeito sem \`locked: true\`.`))
    }
    return out
  }

  // A locked file must be openable by at least one route.
  const crackable = m.crackable !== false
  const decryptGame = m.decryptGame === true || (m.decryptGame == null && !crackable)
  const canDecrypt = decryptGame || has(m, 'decryptTarget')
  if (!crackable && !has(m, 'password') && !canDecrypt) {
    out.push(file('error', 'Arquivo bloqueado e impossível de abrir: não é crackável, não tem senha e o minigame está desativado.'))
  }
  if (!crackable && !has(m, 'crackFailMessage')) {
    out.push(file('warn', 'Arquivo não-crackável sem `crackFailMessage`: o jogador verá só a mensagem padrão ao tentar força bruta.'))
  }

  // Crack sub-flags that need a DC / crackability to matter.
  if (m.crackAttempts != null && m.crackDC == null) {
    out.push(file('warn', '`crackAttempts` só conta quando há `crackDC` (teste de dificuldade).'))
  }
  if (!crackable && (m.crackDC != null || m.crackAttempts != null)) {
    out.push(file('warn', '`crackDC`/`crackAttempts` são ignorados num arquivo não-crackável.'))
  }

  // Tracer needs a scenario-level tracer block to fire.
  const tracerSubs = ['tracerSeconds', 'tracerPenalty', 'tracerStartAfter', 'tracerNocrackSeconds']
  if (m.tracer !== true) {
    for (const k of tracerSubs) {
      if (m[k] != null) out.push(file('warn', `\`${k}\` não tem efeito sem \`tracer: true\`.`))
    }
  }

  // checkAlert needs checkDC.
  if (has(m, 'checkAlert') && m.checkDC == null) {
    out.push(file('warn', '`checkAlert` só dispara quando o arquivo tem `checkDC`.'))
  }

  // imageAlt without image.
  if (has(m, 'imageAlt') && !has(m, 'image')) {
    out.push(file('warn', '`imageAlt` sem `image` não tem efeito.'))
  }

  // reveals must point at real files.
  if (has(m, 'reveals')) {
    const targets = String(m.reveals).split(',').map((s) => s.trim()).filter(Boolean)
    for (const t of targets) {
      const norm = t.startsWith('/') ? t : '/' + t
      if (!allPaths.has(norm)) {
        out.push(file('warn', `\`reveals\` aponta para um arquivo inexistente: ${t}`))
      }
    }
  }

  return out
}

export function validateProject(p: Project): Issue[] {
  const out: Issue[] = []
  const allPaths = new Set(p.files.map((f) => f.path))

  if (!p.meta.id || !String(p.meta.id).trim()) {
    out.push({ severity: 'error', scope: 'scenario', message: 'O cenário precisa de um `id` (vira o nome da pasta no repo).' })
  }
  if (!p.files.length) {
    out.push({ severity: 'warn', scope: 'scenario', message: 'Nenhum arquivo no cenário ainda — o terminal não terá o que ler.' })
  }

  // A watched file with no scenario tracer block never trips.
  const hasTracerBlock = p.meta.tracer != null && typeof p.meta.tracer === 'object'
  const anyWatched = p.files.some((f) => f.meta.tracer === true)
  if (anyWatched && !hasTracerBlock) {
    out.push({ severity: 'warn', scope: 'scenario', message: 'Há arquivos com `tracer: true`, mas o `scenario.json` não tem bloco `tracer` — o rastreador nunca dispara.' })
  }

  // events keys should reference real files.
  for (const key of Object.keys(p.meta.events ?? {})) {
    if (!allPaths.has(key)) {
      out.push({ severity: 'warn', scope: 'scenario', message: `events: o caminho ${key} não corresponde a nenhum arquivo.` })
    }
  }

  for (const f of p.files) out.push(...checkFile(f.path, f.meta, allPaths))

  // i18n parity: which base files lack a translation, and orphan translations.
  for (const [lang, byPath] of Object.entries(p.translations)) {
    for (const f of p.files) {
      if (byPath[f.path] == null) {
        out.push({ severity: 'warn', scope: 'i18n', path: f.path, message: `Sem tradução [${lang}] para ${f.path}.` })
      }
    }
    for (const tp of Object.keys(byPath)) {
      if (!allPaths.has(tp)) {
        out.push({ severity: 'warn', scope: 'i18n', path: tp, message: `Tradução [${lang}] órfã: ${tp} não existe na base.` })
      }
    }
  }

  return out
}
