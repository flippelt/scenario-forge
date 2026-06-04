// The authoritative .dat flag vocabulary, derived directly from the terminal
// engine (commands.js: crack/unlock/decrypt/check; tracer.js: effTracer;
// themes/index.js: buildFilesystem/parseFrontMatter). Each entry documents the
// engine default so the panel can show it as a placeholder. This is the single
// source the FlagsPanel renders — keep it in sync with the engine, and the
// round-trip test guarantees generated front-matter is what the terminal reads.

import type { FileMeta, FrontMatterValue } from './types'

export type FlagType = 'bool' | 'number' | 'string'

export interface FlagDef {
  key: string
  label: string
  type: FlagType
  help: string
  /** Engine default (shown as a hint; not written unless the user sets it). */
  defaultHint?: string
  placeholder?: string
  /** Field only applies when this predicate holds (drives panel visibility). */
  when?: (m: FileMeta) => boolean
}

export interface FlagGroup {
  id: string
  label: string
  help?: string
  fields: FlagDef[]
}

const isLocked = (m: FileMeta) => m.locked === true
const isCrackable = (m: FileMeta) => isLocked(m) && m.crackable !== false
const isWatched = (m: FileMeta) => isLocked(m) && m.tracer === true

export const FLAG_GROUPS: FlagGroup[] = [
  {
    id: 'lock',
    label: 'Bloqueio',
    help: 'Um arquivo bloqueado exige crack, senha ou o minigame de decrypt para ser lido.',
    fields: [
      {
        key: 'locked',
        label: 'Bloqueado',
        type: 'bool',
        help: 'Marca o arquivo como criptografado. Os demais campos só valem se isto estiver ligado.'
      },
      {
        key: 'password',
        label: 'Senha',
        type: 'string',
        help: 'Chave para `unlock`. Senha só de números: o editor coloca aspas automaticamente.',
        when: isLocked
      },
      {
        key: 'reveals',
        label: 'Revela (caminhos)',
        type: 'string',
        help: 'Ao desbloquear, mostra a senha destes arquivos. Vários separados por vírgula. Ex.: /vault.dat,/safe.dat',
        when: isLocked
      }
    ]
  },
  {
    id: 'crack',
    label: 'Força bruta (crack)',
    help: '`crack` quebra o arquivo. Pode ser livre, exigir um teste (DC) ou ser impossível.',
    fields: [
      {
        key: 'crackable',
        label: 'Crackável',
        type: 'bool',
        help: 'Desligue para um arquivo "endurecido" — força bruta falha; só senha/decrypt abrem.',
        defaultHint: 'true',
        when: isLocked
      },
      {
        key: 'crackDC',
        label: 'DC do crack',
        type: 'number',
        help: 'Define um teste de dificuldade: o jogador rola e digita o resultado. Sem DC, o crack é automático.',
        placeholder: 'ex.: 15',
        when: isCrackable
      },
      {
        key: 'crackAttempts',
        label: 'Tentativas',
        type: 'number',
        help: 'Máximo de tentativas de crack antes do lockout.',
        defaultHint: '3',
        placeholder: '3',
        when: (m) => isCrackable(m) && m.crackDC != null
      },
      {
        key: 'crackTime',
        label: 'Duração da barra (ms)',
        type: 'number',
        help: 'Tempo da animação de força bruta.',
        defaultHint: 'tema/5000',
        placeholder: '5000',
        when: isCrackable
      },
      {
        key: 'lockLabel',
        label: 'Rótulo do crack',
        type: 'string',
        help: 'Texto na barra de progresso da força bruta.',
        defaultHint: 'tema/“BRUTE-FORCING”',
        when: isCrackable
      },
      {
        key: 'crackFailMessage',
        label: 'Mensagem de falha',
        type: 'string',
        help: 'Mostrada quando o arquivo NÃO é crackável e o jogador tenta força bruta.',
        when: (m) => isLocked(m) && m.crackable === false
      },
      {
        key: 'crackSuccessMessage',
        label: 'Mensagem de sucesso',
        type: 'string',
        help: 'Substitui o texto padrão de crack bem-sucedido.',
        when: isCrackable
      }
    ]
  },
  {
    id: 'decrypt',
    label: 'Decrypt (minigame)',
    help: 'Minigame estilo Wordle para descobrir a chave. Liga por padrão em arquivos não-crackáveis.',
    fields: [
      {
        key: 'decryptGame',
        label: 'Minigame ativo',
        type: 'bool',
        help: 'Força o minigame ligado/desligado. Padrão: ligado quando o arquivo não é crackável.',
        defaultHint: '= (crackable false)',
        when: isLocked
      },
      {
        key: 'decryptTarget',
        label: 'Palavra-alvo',
        type: 'string',
        help: 'Fixa a palavra do minigame. Em branco: o engine sorteia uma estável no load.',
        when: isLocked
      },
      {
        key: 'decryptLabel',
        label: 'Rótulo do decrypt',
        type: 'string',
        help: 'Texto na barra de progresso do decrypt/unlock.',
        defaultHint: 'tema/“DECRYPTING”',
        when: isLocked
      },
      {
        key: 'decryptTime',
        label: 'Duração da barra (ms)',
        type: 'number',
        help: 'Tempo da animação de decrypt.',
        defaultHint: 'tema/1500',
        placeholder: '1500',
        when: isLocked
      }
    ]
  },
  {
    id: 'tracer',
    label: 'Tracer / vigilância',
    help: 'Arquivo "vigiado": uma intrusão arma o rastreador. O `check` revela a posição de segurança.',
    fields: [
      {
        key: 'tracer',
        label: 'Vigiado',
        type: 'bool',
        help: 'Arma o tracer ao crackar/falhar. Exige um bloco `tracer` no scenario.json para ter efeito.',
        when: isLocked
      },
      {
        key: 'tracerSeconds',
        label: 'Janela (s)',
        type: 'number',
        help: 'Segundos até o rastreio completar.',
        defaultHint: 'tema/30',
        placeholder: '30',
        when: isWatched
      },
      {
        key: 'tracerPenalty',
        label: 'Penalidade',
        type: 'number',
        help: 'Penalidade aplicada quando o tracer completa.',
        defaultHint: '7',
        placeholder: '7',
        when: isWatched
      },
      {
        key: 'tracerStartAfter',
        label: 'Começa após',
        type: 'number',
        help: 'Tentativas de "graça" antes do rastreio começar a contar.',
        defaultHint: '0',
        placeholder: '0',
        when: isWatched
      },
      {
        key: 'tracerNocrackSeconds',
        label: 'Janela (não-crackável)',
        type: 'number',
        help: 'Janela menor de rastreio ao falhar força bruta num arquivo endurecido.',
        defaultHint: 'tema/5',
        placeholder: '5',
        when: isWatched
      }
    ]
  },
  {
    id: 'recon',
    label: 'Recon (check)',
    help: 'O comando `check` lê a postura de segurança. Com DC, vira um teste; só revela tudo no GM mode.',
    fields: [
      {
        key: 'checkDC',
        label: 'DC do check',
        type: 'number',
        help: 'Sem DC o scan é livre e preciso. Com DC, a qualidade do scan depende da rolagem.',
        placeholder: 'ex.: 12',
        when: isLocked
      },
      {
        key: 'checkAlert',
        label: 'Alerta de rescan',
        type: 'string',
        help: 'Texto do alerta de atividade suspeita ao escanear o mesmo arquivo de novo. Sobrescreve o do tema.',
        when: (m) => isLocked(m) && m.checkDC != null
      }
    ]
  },
  {
    id: 'media',
    label: 'Mídia',
    fields: [
      {
        key: 'image',
        label: 'Imagem (URL/data URI)',
        type: 'string',
        help: 'Renderiza uma imagem com filtro CRT acima do texto (foto Esper, mapa, mugshot).'
      },
      {
        key: 'imageAlt',
        label: 'Texto alternativo',
        type: 'string',
        help: 'Descrição da imagem.',
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
