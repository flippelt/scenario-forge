// Local engine pin vs. the engine the published Immersive Terminal consumes.
// Fetch is best-effort: offline / rate-limit just hides the remote half.
// Read our own package.json — rpgterm-engine does not export "./package.json".
import forgePkg from '../../package.json'

export const ENGINE_VERSION: string = String(forgePkg.dependencies['rpgterm-engine'] ?? '').replace(
  /^[^\d]*/,
  ''
)

const ITR_PKG =
  'https://raw.githubusercontent.com/flippelt/Immersive-Terminal-for-RPGs/main/package.json'

export interface VersionReport {
  editor: string
  published: string | null
  drift: boolean
}

export function compareVersions(editor: string, published: string | null): VersionReport {
  if (!published) return { editor, published: null, drift: false }
  const a = editor.replace(/^[^\d]*/, '')
  const b = published.replace(/^[^\d]*/, '')
  return { editor, published, drift: a !== b }
}

export async function fetchPublishedEngineVersion(signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(ITR_PKG, { signal })
    if (!res.ok) return null
    const json = (await res.json()) as { dependencies?: Record<string, string> }
    const pin = json.dependencies?.['rpgterm-engine']
    return pin ? pin.replace(/^[^\d]*/, '') : null
  } catch {
    return null
  }
}
