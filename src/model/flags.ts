// The authoritative .dat flag vocabulary, derived directly from the terminal
// engine (commands.js: crack/unlock/decrypt/check; tracer.js: effTracer;
// themes/index.js: buildFilesystem/parseFrontMatter). Each entry documents the
// engine default so the panel can show it as a placeholder. This is the single
// source the FlagsPanel renders — keep it in sync with the engine, and the
// round-trip test guarantees generated front-matter is what the terminal reads.

import type { FileMeta, FrontMatterValue } from './types'

export type FlagType = 'bool' | 'number' | 'string'

/** Bilingual string: PT-BR (default) and EN, resolved by the panel's locale. */
export interface LocStr {
  pt: string
  en: string
}

export interface FlagDef {
  key: string
  label: LocStr
  type: FlagType
  help: LocStr
  /** Engine default (shown as a hint; not written unless the user sets it). */
  defaultHint?: string
  placeholder?: string
  /** Field only applies when this predicate holds (drives panel visibility). */
  when?: (m: FileMeta) => boolean
}

export interface FlagGroup {
  id: string
  label: LocStr
  help?: LocStr
  fields: FlagDef[]
}

const isLocked = (m: FileMeta) => m.locked === true
const isCrackable = (m: FileMeta) => isLocked(m) && m.crackable !== false
const isWatched = (m: FileMeta) => isLocked(m) && m.tracer === true

export const FLAG_GROUPS: FlagGroup[] = [
  {
    id: 'lock',
    label: { pt: 'Bloqueio', en: 'Lock' },
    help: {
      pt: 'Um arquivo bloqueado exige crack, senha ou o minigame de decrypt para ser lido.',
      en: 'A locked file requires a crack, a password or the decrypt minigame to be read.'
    },
    fields: [
      {
        key: 'locked',
        label: { pt: 'Bloqueado', en: 'Locked' },
        type: 'bool',
        help: {
          pt: 'Marca o arquivo como criptografado. Os demais campos só valem se isto estiver ligado.',
          en: 'Marks the file as encrypted. The other fields only apply when this is on.'
        }
      },
      {
        key: 'password',
        label: { pt: 'Senha', en: 'Password' },
        type: 'string',
        help: {
          pt: 'Chave para `unlock`. Senha só de números: o editor coloca aspas automaticamente.',
          en: 'Key for `unlock`. Numeric-only password: the editor quotes it automatically.'
        },
        when: isLocked
      },
      {
        key: 'reveals',
        label: { pt: 'Revela (caminhos)', en: 'Reveals (paths)' },
        type: 'string',
        help: {
          pt: 'Ao desbloquear, mostra a senha destes arquivos. Vários separados por vírgula. Ex.: /vault.dat,/safe.dat',
          en: 'On unlock, shows the password of these files. Comma-separate several. E.g. /vault.dat,/safe.dat'
        },
        when: isLocked
      }
    ]
  },
  {
    id: 'crack',
    label: { pt: 'Força bruta (crack)', en: 'Brute force (crack)' },
    help: {
      pt: '`crack` quebra o arquivo. Pode ser livre, exigir um teste (DC) ou ser impossível.',
      en: '`crack` breaks the file. It can be free, require a check (DC) or be impossible.'
    },
    fields: [
      {
        key: 'crackable',
        label: { pt: 'Crackável', en: 'Crackable' },
        type: 'bool',
        help: {
          pt: 'Desligue para um arquivo "endurecido" — força bruta falha; só senha/decrypt abrem.',
          en: 'Turn off for a "hardened" file — brute force fails; only password/decrypt open it.'
        },
        defaultHint: 'true',
        when: isLocked
      },
      {
        key: 'crackDC',
        label: { pt: 'DC do crack', en: 'Crack DC' },
        type: 'number',
        help: {
          pt: 'Define um teste de dificuldade: o jogador rola e digita o resultado. Sem DC, o crack é automático.',
          en: 'Sets a difficulty check: the player rolls and types the result. Without a DC, the crack is automatic.'
        },
        placeholder: 'ex.: 15',
        when: isCrackable
      },
      {
        key: 'crackAttempts',
        label: { pt: 'Tentativas', en: 'Attempts' },
        type: 'number',
        help: {
          pt: 'Máximo de tentativas de crack antes do lockout.',
          en: 'Maximum crack attempts before lockout.'
        },
        defaultHint: '3',
        placeholder: '3',
        when: (m) => isCrackable(m) && m.crackDC != null
      },
      {
        key: 'crackTime',
        label: { pt: 'Duração da barra (ms)', en: 'Bar duration (ms)' },
        type: 'number',
        help: {
          pt: 'Tempo da animação de força bruta.',
          en: 'Duration of the brute-force animation.'
        },
        defaultHint: 'tema/5000',
        placeholder: '5000',
        when: isCrackable
      },
      {
        key: 'lockLabel',
        label: { pt: 'Rótulo do crack', en: 'Crack label' },
        type: 'string',
        help: {
          pt: 'Texto na barra de progresso da força bruta.',
          en: 'Text on the brute-force progress bar.'
        },
        defaultHint: 'tema/“BRUTE-FORCING”',
        when: isCrackable
      },
      {
        key: 'crackFailMessage',
        label: { pt: 'Mensagem de falha', en: 'Failure message' },
        type: 'string',
        help: {
          pt: 'Mostrada quando o arquivo NÃO é crackável e o jogador tenta força bruta.',
          en: 'Shown when the file is NOT crackable and the player tries brute force.'
        },
        when: (m) => isLocked(m) && m.crackable === false
      },
      {
        key: 'crackSuccessMessage',
        label: { pt: 'Mensagem de sucesso', en: 'Success message' },
        type: 'string',
        help: {
          pt: 'Substitui o texto padrão de crack bem-sucedido.',
          en: 'Overrides the default successful-crack text.'
        },
        when: isCrackable
      }
    ]
  },
  {
    id: 'decrypt',
    label: { pt: 'Decrypt (minigame)', en: 'Decrypt (minigame)' },
    help: {
      pt: 'Minigame estilo Wordle para descobrir a chave. Liga por padrão em arquivos não-crackáveis.',
      en: 'Wordle-style minigame to find the key. On by default for non-crackable files.'
    },
    fields: [
      {
        key: 'decryptGame',
        label: { pt: 'Minigame ativo', en: 'Minigame enabled' },
        type: 'bool',
        help: {
          pt: 'Força o minigame ligado/desligado. Padrão: ligado quando o arquivo não é crackável.',
          en: 'Forces the minigame on/off. Default: on when the file is not crackable.'
        },
        defaultHint: '= (crackable false)',
        when: isLocked
      },
      {
        key: 'decryptTarget',
        label: { pt: 'Palavra-alvo', en: 'Target word' },
        type: 'string',
        help: {
          pt: 'Fixa a palavra do minigame. Em branco: o engine sorteia uma estável no load.',
          en: 'Pins the minigame word. Blank: the engine picks a stable one at load.'
        },
        when: isLocked
      },
      {
        key: 'decryptLabel',
        label: { pt: 'Rótulo do decrypt', en: 'Decrypt label' },
        type: 'string',
        help: {
          pt: 'Texto na barra de progresso do decrypt/unlock.',
          en: 'Text on the decrypt/unlock progress bar.'
        },
        defaultHint: 'tema/“DECRYPTING”',
        when: isLocked
      },
      {
        key: 'decryptTime',
        label: { pt: 'Duração da barra (ms)', en: 'Bar duration (ms)' },
        type: 'number',
        help: {
          pt: 'Tempo da animação de decrypt.',
          en: 'Duration of the decrypt animation.'
        },
        defaultHint: 'tema/1500',
        placeholder: '1500',
        when: isLocked
      }
    ]
  },
  {
    id: 'tracer',
    label: { pt: 'Tracer / vigilância', en: 'Tracer / surveillance' },
    help: {
      pt: 'Arquivo "vigiado": uma intrusão arma o rastreador. O `check` revela a posição de segurança.',
      en: 'A "watched" file: an intrusion arms the tracer. `check` reveals the security posture.'
    },
    fields: [
      {
        key: 'tracer',
        label: { pt: 'Vigiado', en: 'Watched' },
        type: 'bool',
        help: {
          pt: 'Arma o tracer ao crackar/falhar. Exige um bloco `tracer` no scenario.json para ter efeito.',
          en: 'Arms the tracer on crack/fail. Requires a `tracer` block in scenario.json to take effect.'
        },
        when: isLocked
      },
      {
        key: 'tracerSeconds',
        label: { pt: 'Janela (s)', en: 'Window (s)' },
        type: 'number',
        help: {
          pt: 'Segundos até o rastreio completar.',
          en: 'Seconds until the trace completes.'
        },
        defaultHint: 'tema/30',
        placeholder: '30',
        when: isWatched
      },
      {
        key: 'tracerPenalty',
        label: { pt: 'Penalidade', en: 'Penalty' },
        type: 'number',
        help: {
          pt: 'Penalidade aplicada quando o tracer completa.',
          en: 'Penalty applied when the tracer completes.'
        },
        defaultHint: '7',
        placeholder: '7',
        when: isWatched
      },
      {
        key: 'tracerStartAfter',
        label: { pt: 'Começa após', en: 'Starts after' },
        type: 'number',
        help: {
          pt: 'Tentativas de "graça" antes do rastreio começar a contar.',
          en: '"Grace" attempts before the trace starts counting.'
        },
        defaultHint: '0',
        placeholder: '0',
        when: isWatched
      },
      {
        key: 'tracerNocrackSeconds',
        label: { pt: 'Janela (não-crackável)', en: 'Window (non-crackable)' },
        type: 'number',
        help: {
          pt: 'Janela menor de rastreio ao falhar força bruta num arquivo endurecido.',
          en: 'Shorter trace window when brute force fails on a hardened file.'
        },
        defaultHint: 'tema/5',
        placeholder: '5',
        when: isWatched
      }
    ]
  },
  {
    id: 'recon',
    label: { pt: 'Recon (check)', en: 'Recon (check)' },
    help: {
      pt: 'O comando `check` lê a postura de segurança. Com DC, vira um teste; só revela tudo no GM mode.',
      en: 'The `check` command reads the security posture. With a DC it becomes a check; only GM mode reveals all.'
    },
    fields: [
      {
        key: 'checkDC',
        label: { pt: 'DC do check', en: 'Check DC' },
        type: 'number',
        help: {
          pt: 'Sem DC o scan é livre e preciso. Com DC, a qualidade do scan depende da rolagem.',
          en: 'Without a DC the scan is free and accurate. With a DC, scan quality depends on the roll.'
        },
        placeholder: 'ex.: 12',
        when: isLocked
      },
      {
        key: 'checkAlert',
        label: { pt: 'Alerta de rescan', en: 'Rescan alert' },
        type: 'string',
        help: {
          pt: 'Texto do alerta de atividade suspeita ao escanear o mesmo arquivo de novo. Sobrescreve o do tema.',
          en: 'Suspicious-activity alert text when scanning the same file again. Overrides the theme’s.'
        },
        when: (m) => isLocked(m) && m.checkDC != null
      }
    ]
  },
  {
    id: 'media',
    label: { pt: 'Mídia', en: 'Media' },
    fields: [
      {
        key: 'image',
        label: { pt: 'Imagem (URL/data URI)', en: 'Image (URL/data URI)' },
        type: 'string',
        help: {
          pt: 'Renderiza uma imagem com filtro CRT acima do texto (foto Esper, mapa, mugshot).',
          en: 'Renders a CRT-filtered image above the text (Esper photo, map, mugshot).'
        }
      },
      {
        key: 'imageAlt',
        label: { pt: 'Texto alternativo', en: 'Alt text' },
        type: 'string',
        help: {
          pt: 'Descrição da imagem.',
          en: 'Description of the image.'
        },
        when: (m) => m.image != null && m.image !== ''
      }
    ]
  }
]

/** Every flag key the engine understands (for parser/validation awareness). */
export const KNOWN_FLAG_KEYS: string[] = FLAG_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.key)
)

/** Coerce a panel input into the right front-matter primitive. */
export function coerceFlag(type: FlagType, raw: string): FrontMatterValue {
  if (type === 'bool') return raw === 'true'
  if (type === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  return raw
}
