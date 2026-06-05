// Starter scenarios. Each template builds a fresh Project the editor loads, so
// the user starts from something playable instead of a blank page. The flags
// used here are the real engine ones (lock/crack/tracer/checkDC) — see flags.ts.

import type { Project } from './types'
import { emptyProject } from './types'
import type { LocStr } from './flags'

export interface Template {
  id: string
  label: LocStr
  description: LocStr
  build: () => Project
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: { pt: 'Em branco', en: 'Blank' },
    description: {
      pt: 'Cenário vazio. Escolha o tema no painel do scenario.json e comece do zero.',
      en: 'Empty scenario. Pick the theme in the scenario.json panel and start from scratch.'
    },
    build: () => emptyProject('ibm')
  },
  {
    id: 'vault',
    label: { pt: 'Cofre bloqueado (IBM)', en: 'Locked vault (IBM)' },
    description: {
      pt: 'Um arquivo de dados endurecido (sem crack), aberto só por senha. Bom para um segredo central.',
      en: 'A hardened data file (no crack), opened only by password. Good for one central secret.'
    },
    build: (): Project => ({
      theme: 'ibm',
      meta: {
        id: 'cofre',
        name: 'O Cofre',
        motd: ['ESTAÇÃO SEGURA // SOMENTE PESSOAL AUTORIZADO', '', 'tente: `cat leiame.md`, `ls`, `crack vault.dat`']
      },
      files: [
        {
          path: '/leiame.md',
          content: '# Estação 9\n\nO cofre guarda o que não deveria existir. Força bruta não abre — **ache a senha**.',
          meta: {}
        },
        {
          path: '/vault.dat',
          content: 'VAULT // EYES ONLY\n==================\nAs coordenadas do Site 9 estão em anexo.',
          meta: {
            locked: true,
            password: 'BLACKSITE-NINE',
            crackable: false,
            crackFailMessage: 'vault.dat: criptografia reforçada. força bruta não funciona — chave necessária.',
            decryptLabel: 'ABRINDO O COFRE'
          }
        }
      ],
      translations: {},
      dirPath: null
    })
  },
  {
    id: 'tracer-case',
    label: { pt: 'Investigação com tracer (Cyberpunk RED)', en: 'Tracer investigation (Cyberpunk RED)' },
    description: {
      pt: 'Arquivo vigiado: crackar/escanear arma o rastreador. Inclui o bloco tracer no scenario.json e um teste de recon (checkDC).',
      en: 'A watched file: cracking/scanning arms the tracer. Includes the scenario.json tracer block and a recon check (checkDC).'
    },
    build: (): Project => ({
      theme: 'cprd',
      meta: {
        id: 'caso-4127a',
        name: 'Caso 4127-A',
        motd: ['// Console de Agente NetWatch //', '', 'tente: `cat caso.md`, `check blackbox.dat`, `crack blackbox.dat`'],
        tracer: { seconds: 30, penalty: 7, startAfter: 1, nocrackSeconds: 3, label: 'ICE TRACE' }
      },
      files: [
        {
          path: '/caso.md',
          content: '# Caso 4127-A\n\nIncursão ilegal. O `blackbox.dat` tem a verdade — mas é **vigiado**. Escaneie antes (`check`).',
          meta: {}
        },
        {
          path: '/blackbox.dat',
          content: '// NETWATCH INTERNAL — OPERAÇÃO PHARMAKOS //\nO projeto era uma armadilha controlada.',
          meta: {
            locked: true,
            password: 'OPERATION-PHARMAKOS',
            crackable: false,
            tracer: true,
            checkDC: 15,
            crackFailMessage: 'CRIPTOGRAFIA FEDERAL. TENTATIVA SINALIZADA.'
          }
        }
      ],
      translations: {},
      dirPath: null
    })
  }
]
