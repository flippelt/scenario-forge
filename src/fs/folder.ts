import type { SystemId } from '../model/types'
import { SYSTEMS } from '../model/types'

const VALID = new Set<string>(SYSTEMS.map((s) => s.id))

/** Files/dirs that sneak in from OS compressors and Finder. */
export function isJunkPath(path: string): boolean {
  return path.split('/').some(
    (p) =>
      p === '.DS_Store' ||
      p === 'Thumbs.db' ||
      p === '__MACOSX' ||
      (p.startsWith('.') && p !== '.' && p !== '..')
  )
}

export function omitJunk(entries: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, content] of Object.entries(entries)) {
    if (!path || path.endsWith('/') || isJunkPath(path)) continue
    out[path.replace(/\\/g, '/')] = content
  }
  return out
}

export function asSystemId(v: unknown): SystemId | undefined {
  return typeof v === 'string' && VALID.has(v) ? (v as SystemId) : undefined
}

/**
 * Locate the scenario root inside a picked folder or zip. macOS "Compress"
 * and `<input webkitdirectory>` both prefix paths with the folder name, so
 * `scenario.json` may sit at `heimdall/scenario.json` or
 * `cprd/heimdall/scenario.json`.
 */
export function locateScenarioRoot(paths: string[]): { prefix: string; theme?: SystemId } {
  const jsons = paths
    .filter((p) => !isJunkPath(p) && (p === 'scenario.json' || p.endsWith('/scenario.json')))
    .sort((a, b) => a.split('/').length - b.split('/').length || a.length - b.length)
  if (jsons.length === 0) {
    throw new Error('Pasta sem scenario.json (precisa de scenario.json + files/).')
  }
  const jsonPath = jsons[0]
  const prefix = jsonPath === 'scenario.json' ? '' : jsonPath.slice(0, -'scenario.json'.length)
  const parts = prefix.replace(/\/$/, '').split('/').filter(Boolean)
  const parent = parts.length >= 2 ? parts[parts.length - 2] : undefined
  return { prefix, theme: asSystemId(parent) }
}

export function stripPrefix(entries: Record<string, string>, prefix: string): Record<string, string> {
  if (!prefix) return { ...entries }
  const out: Record<string, string> = {}
  for (const [path, content] of Object.entries(entries)) {
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = content
  }
  return out
}
