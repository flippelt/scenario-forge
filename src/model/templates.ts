// Starter scenarios. Each template builds a fresh Project the editor loads, so
// the user starts from something playable instead of a blank page. The flags
// used here are the real engine ones (lock/crack/tracer/checkDC) — see flags.ts.

import type { Project } from './types'
import { emptyProject } from './types'

export interface Template {
  id: string
  label: string
  description: string
  build: () => Project
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Em branco',
    description: 'Cenário vazio. Escolha o tema no painel do scenario.json e comece do zero.',
    build: () => emptyProject('ibm')
  },
  {
    id: 'vault',
    label: 'Cofre bloqueado (IBM)',
    description: 'Um arquivo de dados endurecido (sem crack), aberto só por senha. Bom para um segredo central.',
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
    label: 'Investigação com tracer (Cyberpunk RED)',
    description: 'Arquivo vigiado: crackar/escanear arma o rastreador. Inclui o bloco tracer no scenario.json e um teste de recon (checkDC).',
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
