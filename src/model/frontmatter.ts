// Front-matter parse/serialize, a faithful round-trip of the engine's
// parseFrontMatter (themes/index.js). The engine reads a leading `---\n…\n---`
// block of flat `key: value` lines; unquoted values coerce to bool/number, and
// a quoted value forces a string (e.g. a numeric password). We mirror the read
// exactly and make the write the precise inverse so the terminal sees what the
// editor produced.

import type { FileMeta, FrontMatterValue } from './types'

export interface ParsedFile {
  meta: FileMeta
  content: string
}

/** Mirror of the engine parser. CRLF-normalised; trailing blank lines trimmed
 *  from the body, exactly as the engine does. */
export function parseFrontMatter(raw: string): ParsedFile {
  const text = String(raw).replace(/\r\n/g, '\n')
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { meta: {}, content: text.replace(/\n+$/, '') }
  const [, header, body] = m
  const meta: FileMeta = {}
  for (const line of header.split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    const rawVal = line.slice(i + 1).trim()
    let val: FrontMatterValue = rawVal
    if (/^".*"$/.test(rawVal) || /^'.*'$/.test(rawVal)) val = rawVal.slice(1, -1)
    else if (rawVal === 'true') val = true
    else if (rawVal === 'false') val = false
    else if (/^-?\d+$/.test(rawVal)) val = parseInt(rawVal, 10)
    meta[key] = val
  }
  return { meta, content: body.replace(/\n+$/, '') }
}

/** A string value must be quoted iff the parser would otherwise coerce it
 *  (to bool/number) or mangle it (surrounding quotes, edge whitespace). */
function needsQuoting(v: string): boolean {
  if (v === 'true' || v === 'false') return true
  if (/^-?\d+$/.test(v)) return true
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return true
  if (v !== v.trim()) return true
  return false
}

function serializeValue(v: FrontMatterValue): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  return needsQuoting(v) ? JSON.stringify(v) : v
}

/** Inverse of parseFrontMatter. Empty meta => a plain file (no `---` block).
 *  Round-trips through parseFrontMatter for any single-line value. */
export function serializeFrontMatter(meta: FileMeta, content: string): string {
  const keys = Object.keys(meta)
  const body = content.replace(/\n+$/, '')
  if (keys.length === 0) return body
  const header = keys
    .map((k) => `${k}: ${serializeValue(meta[k])}`)
    .join('\n')
  return `---\n${header}\n---\n${body}`
}
