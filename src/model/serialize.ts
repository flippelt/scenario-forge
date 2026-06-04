// Converters between the in-memory Project and the on-the-wire formats:
//   • repo folder   — scenario.json + files/ + files.<lang>/   (versionable)
//   • runtime bundle — a single JSON the terminal loads via composeCustomScenario
// Both directions are provided so Import (Fase 3) is the exact inverse of Export.

import type { Project, ScenarioMeta, FileNode, SystemId, Translations } from './types'
import { SYSTEMS } from './types'
import { parseFrontMatter, serializeFrontMatter } from './frontmatter'

const VALID_THEMES = new Set<string>(SYSTEMS.map((s) => s.id))
function asTheme(v: unknown): SystemId {
  return typeof v === 'string' && VALID_THEMES.has(v) ? (v as SystemId) : 'ibm'
}

const rel = (path: string) => path.replace(/^\//, '')

// --- runtime bundle --------------------------------------------------------

/** Build the single JSON the terminal loads (`loadscenario <url>` / paste).
 *  Mirrors what composeCustomScenario expects: scenario fields + theme + a
 *  `files` map of path -> raw text (front-matter inline) + i18n file bodies. */
export function toRuntimeBundle(p: Project): Record<string, unknown> {
  const files: Record<string, string> = {}
  for (const f of p.files) files[f.path] = serializeFrontMatter(f.meta, f.content)

  // Fold directory translations into the inline i18n.<lang>.files channel.
  // Existing inline overrides win on conflict (engine semantics).
  const i18n: Record<string, Record<string, unknown>> = {}
  for (const [lang, block] of Object.entries(p.meta.i18n ?? {})) {
    i18n[lang] = { ...block }
  }
  for (const [lang, byPath] of Object.entries(p.translations)) {
    const inlineFiles = (i18n[lang]?.files as Record<string, string>) ?? {}
    i18n[lang] = { ...i18n[lang], files: { ...byPath, ...inlineFiles } }
  }

  const { i18n: _drop, ...rest } = p.meta
  const bundle: Record<string, unknown> = { ...rest, theme: p.theme, files }
  if (Object.keys(i18n).length) bundle.i18n = i18n
  return bundle
}

/** Inverse of toRuntimeBundle (Import a pasted/fetched bundle). */
export function fromRuntimeBundle(bundle: Record<string, unknown>): Project {
  const theme = asTheme(bundle.theme)
  const filesObj = (bundle.files as Record<string, string>) ?? {}
  const files: FileNode[] = Object.entries(filesObj).map(([path, raw]) => {
    const p = path.startsWith('/') ? path : '/' + path
    const { meta, content } = parseFrontMatter(String(raw))
    return { path: p, content, meta }
  })

  const translations: Translations = {}
  const i18nIn = (bundle.i18n as Record<string, Record<string, unknown>>) ?? {}
  const i18nOut: Record<string, Record<string, unknown>> = {}
  for (const [lang, block] of Object.entries(i18nIn)) {
    const { files: langFiles, ...restBlock } = block
    if (langFiles && typeof langFiles === 'object') {
      translations[lang] = {}
      for (const [path, body] of Object.entries(langFiles as Record<string, string>)) {
        translations[lang][path.startsWith('/') ? path : '/' + path] = String(body)
      }
    }
    if (Object.keys(restBlock).length) i18nOut[lang] = restBlock
  }

  const { theme: _t, files: _f, i18n: _i, ...metaRest } = bundle
  const meta = { id: 'imported', ...(metaRest as object) } as ScenarioMeta
  if (Object.keys(i18nOut).length) meta.i18n = i18nOut

  return { theme, meta, files, translations, dirPath: null }
}

// --- repo folder -----------------------------------------------------------

export interface FolderExport {
  /** Suggested location under scenarios/, e.g. `cprd/heimdall`. */
  suggestedDir: string
  /** Relative path within the scenario dir -> file content. */
  files: Record<string, string>
}

/** Produce the versionable folder layout (scenario.json + files trees). */
export function toRepoFolder(p: Project): FolderExport {
  const out: Record<string, string> = {}
  out['scenario.json'] = JSON.stringify(p.meta, null, 2) + '\n'
  for (const f of p.files) {
    out[`files/${rel(f.path)}`] = serializeFrontMatter(f.meta, f.content)
  }
  for (const [lang, byPath] of Object.entries(p.translations)) {
    for (const [path, body] of Object.entries(byPath)) {
      out[`files.${lang}/${rel(path)}`] = body
    }
  }
  return { suggestedDir: `${p.theme}/${p.meta.id}`, files: out }
}

/** Inverse of toRepoFolder. `entries` maps a relative path (scenario.json,
 *  files/…, files.<lang>/…) to its raw content; `theme` comes from the folder. */
export function fromRepoFolder(
  entries: Record<string, string>,
  theme: SystemId
): Project {
  let meta: ScenarioMeta = { id: 'scenario' }
  const files: FileNode[] = []
  const translations: Translations = {}

  for (const [path, content] of Object.entries(entries)) {
    if (path === 'scenario.json') {
      try {
        meta = JSON.parse(content) as ScenarioMeta
      } catch {
        /* leave default; validation will flag a broken scenario.json */
      }
      continue
    }
    const base = path.match(/^files\/(.+)$/)
    if (base) {
      const { meta: fmeta, content: body } = parseFrontMatter(content)
      files.push({ path: '/' + base[1], content: body, meta: fmeta })
      continue
    }
    const trans = path.match(/^files\.([a-z]{2})\/(.+)$/)
    if (trans) {
      const [, lang, relPath] = trans
      // Translations are body-only; strip any stray front-matter.
      const { content: body } = parseFrontMatter(content)
      ;(translations[lang] ??= {})['/' + relPath] = body
    }
  }

  return { theme, meta, files, translations, dirPath: null }
}
