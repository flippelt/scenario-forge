// Data model for a scenario project. Anchored to the real terminal engine
// (Immersive-Terminal-for-RPGs): see src/engine/commands.js +
// src/themes/index.js. The flag vocabulary lives in ./flags.ts; the
// serializers in ./serialize.ts convert between this in-memory shape and the
// three on-the-wire formats (repo folder, runtime bundle, store).

/** The 8 systems a scenario can plug into (one folder per theme on disk). */
export type SystemId =
  | 'alien'
  | 'br'
  | 'cprd'
  | 'dataslate'
  | 'fallout'
  | 'ibm'
  | 'lancer'
  | 'wh40k'

export const SYSTEMS: { id: SystemId; label: string }[] = [
  { id: 'alien', label: 'Alien — MU/TH/UR' },
  { id: 'br', label: 'Blade Runner' },
  { id: 'cprd', label: 'Cyberpunk RED' },
  { id: 'dataslate', label: 'WH40K — Dataslate' },
  { id: 'fallout', label: 'Fallout — Pip/Terminal' },
  { id: 'ibm', label: 'IBM / Retro PC' },
  { id: 'lancer', label: 'LANCER' },
  { id: 'wh40k', label: 'Warhammer 40K' }
]

/** Front-matter values coerce to bool/number; everything else is a string. */
export type FrontMatterValue = string | number | boolean
export type FileMeta = Record<string, FrontMatterValue>

/** One file in the player-visible filesystem. `meta` holds the .dat flags
 *  (lock/crack/tracer…). Only base-language files carry meta. */
export interface FileNode {
  /** Absolute VFS path, always with a leading slash, e.g. `/intel/safe.dat`. */
  path: string
  /** Body text, front-matter stripped. */
  content: string
  /** Front-matter flags. Empty object => a plain file (no `---` block). */
  meta: FileMeta
}

/** lang code -> { vfs path -> translated body }. Bodies only; locks stay on
 *  the base file (the engine ignores translated front-matter). */
export type Translations = Record<string, Record<string, string>>

/** A terminal output line. `boot`/`events`/`commands` use this shape; a bare
 *  string is also accepted by the engine and normalised to `{ text }`. */
export interface Line {
  text?: string
  type?: string
  [k: string]: unknown
}

export interface DialogResponse {
  match: string[]
  type?: string
  lines: string[]
}

export interface Dialog {
  thinking?: string | string[]
  fallback?: string | string[]
  empty?: string | string[]
  responses?: DialogResponse[]
}

/** scenario.json. The editor forms touch a known subset; anything else
 *  round-trips verbatim via the index signature so nothing is lost. */
export interface ScenarioMeta {
  id: string
  name?: string
  header?: string
  prompt?: string
  user?: string
  boot?: Line[]
  motd?: string[]
  dialog?: Dialog | null
  tracer?: Record<string, unknown> | null
  selfDestruct?: Record<string, unknown> | null
  login?: Record<string, unknown> | null
  events?: Record<string, Line[]>
  aliases?: Record<string, string>
  locks?: Record<string, unknown>
  commands?: Record<string, unknown>
  checkMisleadsOnFail?: boolean
  i18n?: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

/** The whole editor project: a theme + a scenario.json + the file trees. */
export interface Project {
  theme: SystemId
  meta: ScenarioMeta
  /** Base-language files (own the flags). */
  files: FileNode[]
  /** Parallel translated bodies, keyed by lang then path. */
  translations: Translations
  /** Absolute folder this was opened from (for "Save"); null if unsaved. */
  dirPath: string | null
}

export function emptyProject(theme: SystemId = 'ibm'): Project {
  return {
    theme,
    meta: { id: 'new-scenario', name: 'New Scenario', motd: [] },
    files: [],
    translations: {},
    dirPath: null
  }
}
