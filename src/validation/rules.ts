// Cross-field consistency checks, derived from how the engine actually reads
// the flags (commands.js). The goal is to catch "this won't do what you think"
// before export: a watched file with no tracer block, a hardened file nobody
// can open, a flag set on the wrong kind of file, an orphan translation.

import type { Project, FileMeta } from '../model/types'
import type { LocStr } from '../model/flags'

export type Severity = 'error' | 'warn'

export interface Issue {
  severity: Severity
  /** What it concerns, for grouping in the panel. */
  scope: 'scenario' | 'file' | 'i18n'
  path?: string
  /** Bilingual message — the panel resolves it against the editor locale. */
  message: LocStr
}

const has = (m: FileMeta, k: string) => m[k] != null && m[k] !== ''

function checkFile(path: string, m: FileMeta, allPaths: Set<string>): Issue[] {
  const out: Issue[] = []
  const locked = m.locked === true
  const file = (severity: Severity, message: LocStr): Issue => ({
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
      if (m[k] != null) out.push(file('warn', {
        pt: `\`${k}\` não tem efeito sem \`locked: true\`.`,
        en: `\`${k}\` has no effect without \`locked: true\`.`
      }))
    }
    return out
  }

  // A locked file must be openable by at least one route.
  const crackable = m.crackable !== false
  const decryptGame = m.decryptGame === true || (m.decryptGame == null && !crackable)
  const canDecrypt = decryptGame || has(m, 'decryptTarget')
  if (!crackable && !has(m, 'password') && !canDecrypt) {
    out.push(file('error', {
      pt: 'Arquivo bloqueado e impossível de abrir: não é crackável, não tem senha e o minigame está desativado.',
      en: 'Locked file that cannot be opened: it is not crackable, has no password and the minigame is disabled.'
    }))
  }
  if (!crackable && !has(m, 'crackFailMessage')) {
    out.push(file('warn', {
      pt: 'Arquivo não-crackável sem `crackFailMessage`: o jogador verá só a mensagem padrão ao tentar força bruta.',
      en: 'Non-crackable file without `crackFailMessage`: the player only sees the default message when trying brute force.'
    }))
  }

  // Crack sub-flags that need a DC / crackability to matter.
  if (m.crackAttempts != null && m.crackDC == null) {
    out.push(file('warn', {
      pt: '`crackAttempts` só conta quando há `crackDC` (teste de dificuldade).',
      en: '`crackAttempts` only counts when there is a `crackDC` (difficulty check).'
    }))
  }
  if (!crackable && (m.crackDC != null || m.crackAttempts != null)) {
    out.push(file('warn', {
      pt: '`crackDC`/`crackAttempts` são ignorados num arquivo não-crackável.',
      en: '`crackDC`/`crackAttempts` are ignored on a non-crackable file.'
    }))
  }

  // Tracer needs a scenario-level tracer block to fire.
  const tracerSubs = ['tracerSeconds', 'tracerPenalty', 'tracerStartAfter', 'tracerNocrackSeconds']
  if (m.tracer !== true) {
    for (const k of tracerSubs) {
      if (m[k] != null) out.push(file('warn', {
        pt: `\`${k}\` não tem efeito sem \`tracer: true\`.`,
        en: `\`${k}\` has no effect without \`tracer: true\`.`
      }))
    }
  }

  // checkAlert needs checkDC.
  if (has(m, 'checkAlert') && m.checkDC == null) {
    out.push(file('warn', {
      pt: '`checkAlert` só dispara quando o arquivo tem `checkDC`.',
      en: '`checkAlert` only fires when the file has a `checkDC`.'
    }))
  }

  // imageAlt without image.
  if (has(m, 'imageAlt') && !has(m, 'image')) {
    out.push(file('warn', {
      pt: '`imageAlt` sem `image` não tem efeito.',
      en: '`imageAlt` without `image` has no effect.'
    }))
  }

  // reveals must point at real files.
  if (has(m, 'reveals')) {
    const targets = String(m.reveals).split(',').map((s) => s.trim()).filter(Boolean)
    for (const t of targets) {
      const norm = t.startsWith('/') ? t : '/' + t
      if (!allPaths.has(norm)) {
        out.push(file('warn', {
          pt: `\`reveals\` aponta para um arquivo inexistente: ${t}`,
          en: `\`reveals\` points at a file that does not exist: ${t}`
        }))
      }
    }
  }

  return out
}

export function validateProject(p: Project): Issue[] {
  const out: Issue[] = []
  const allPaths = new Set(p.files.map((f) => f.path))

  if (!p.meta.id || !String(p.meta.id).trim()) {
    out.push({
      severity: 'error',
      scope: 'scenario',
      message: {
        pt: 'O cenário precisa de um `id` (vira o nome da pasta no repo).',
        en: 'The scenario needs an `id` (it becomes the folder name in the repo).'
      }
    })
  }
  if (!p.files.length) {
    out.push({
      severity: 'warn',
      scope: 'scenario',
      message: {
        pt: 'Nenhum arquivo no cenário ainda — o terminal não terá o que ler.',
        en: 'No files in the scenario yet — the terminal will have nothing to read.'
      }
    })
  }

  // A watched file with no scenario tracer block never trips.
  const hasTracerBlock = p.meta.tracer != null && typeof p.meta.tracer === 'object'
  const anyWatched = p.files.some((f) => f.meta.tracer === true)
  if (anyWatched && !hasTracerBlock) {
    out.push({
      severity: 'warn',
      scope: 'scenario',
      message: {
        pt: 'Há arquivos com `tracer: true`, mas o `scenario.json` não tem bloco `tracer` — o rastreador nunca dispara.',
        en: 'Some files have `tracer: true`, but `scenario.json` has no `tracer` block — the tracer never fires.'
      }
    })
  }

  // events keys should reference real files.
  for (const key of Object.keys(p.meta.events ?? {})) {
    if (!allPaths.has(key)) {
      out.push({
        severity: 'warn',
        scope: 'scenario',
        message: {
          pt: `events: o caminho ${key} não corresponde a nenhum arquivo.`,
          en: `events: the path ${key} does not match any file.`
        }
      })
    }
  }

  for (const f of p.files) out.push(...checkFile(f.path, f.meta, allPaths))

  // i18n parity: which base files lack a translation, and orphan translations.
  for (const [lang, byPath] of Object.entries(p.translations)) {
    for (const f of p.files) {
      if (byPath[f.path] == null) {
        out.push({
          severity: 'warn',
          scope: 'i18n',
          path: f.path,
          message: {
            pt: `Sem tradução [${lang}] para ${f.path}.`,
            en: `Missing [${lang}] translation for ${f.path}.`
          }
        })
      }
    }
    for (const tp of Object.keys(byPath)) {
      if (!allPaths.has(tp)) {
        out.push({
          severity: 'warn',
          scope: 'i18n',
          path: tp,
          message: {
            pt: `Tradução [${lang}] órfã: ${tp} não existe na base.`,
            en: `Orphan [${lang}] translation: ${tp} does not exist in the base.`
          }
        })
      }
    }
  }

  return out
}
