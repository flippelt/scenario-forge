import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

/** Store a repo-folder map (`scenario.json`, `files/…`) as a zip. */
export function packZip(files: Record<string, string>): Uint8Array {
  const bin: Record<string, Uint8Array> = {}
  for (const [path, content] of Object.entries(files)) {
    if (!path || path.endsWith('/')) continue
    bin[path] = strToU8(content)
  }
  return zipSync(bin)
}

/** Inverse of packZip. Directory entries are dropped. */
export function unpackZip(data: Uint8Array): Record<string, string> {
  const unzipped = unzipSync(data)
  const out: Record<string, string> = {}
  for (const [path, bytes] of Object.entries(unzipped)) {
    if (!path || path.endsWith('/')) continue
    out[path.replace(/\\/g, '/')] = strFromU8(bytes)
  }
  return out
}
