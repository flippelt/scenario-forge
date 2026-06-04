// Filesystem boundary. Real folder I/O uses the Tauri fs + dialog plugins;
// when running as a plain web app (dev without the Rust shell, or a browser
// preview) it degrades to JSON-bundle download/upload. Tauri APIs are imported
// dynamically so the web build never references a missing global.

import { decodeBundle } from 'rpgterm-engine'
import type { Project, SystemId } from '../model/types'
import { SYSTEMS } from '../model/types'
import { fromRepoFolder, toRepoFolder, toRuntimeBundle, fromRuntimeBundle } from '../model/serialize'

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

const VALID = new Set<string>(SYSTEMS.map((s) => s.id))
const join = (...parts: string[]) =>
  parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/')

// --- Tauri plugin handles (lazy) ------------------------------------------
async function fs() {
  return import('@tauri-apps/plugin-fs')
}
async function dialog() {
  return import('@tauri-apps/plugin-dialog')
}

// Recursively collect files under a directory as { relPath -> text }, relative
// to `root`. Only descends scenario.json + files/ + files.<lang>/.
async function readTree(root: string): Promise<Record<string, string>> {
  const { readDir, readTextFile } = await fs()
  const out: Record<string, string> = {}

  const walk = async (abs: string, relBase: string) => {
    const entries = await readDir(abs)
    for (const e of entries) {
      const absChild = join(abs, e.name)
      const relChild = relBase ? `${relBase}/${e.name}` : e.name
      if (e.isDirectory) {
        await walk(absChild, relChild)
      } else if (e.isFile) {
        out[relChild] = await readTextFile(absChild)
      }
    }
  }

  await walk(root, '')
  return out
}

/** Pick a scenario folder and load it. Theme is inferred from the parent
 *  folder name (scenarios/<theme>/<id>); falls back to `ibm` if unknown. */
export async function openScenarioFolder(): Promise<Project | null> {
  if (!isTauri()) throw new Error('Abrir pasta requer o app desktop (Tauri).')
  const { open } = await dialog()
  const picked = await open({ directory: true, multiple: false, title: 'Abrir pasta do cenário' })
  if (!picked || typeof picked !== 'string') return null

  const norm = picked.replace(/\\/g, '/').replace(/\/+$/, '')
  const parent = norm.split('/').slice(-2, -1)[0] ?? ''
  const theme: SystemId = VALID.has(parent) ? (parent as SystemId) : 'ibm'

  const entries = await readTree(norm)
  const project = fromRepoFolder(entries, theme)
  project.dirPath = norm
  return project
}

/** Write the repo folder layout. With no target dir, prompts for a parent and
 *  writes under <theme>/<id>/. Returns the scenario dir written to. */
export async function saveScenarioFolder(project: Project): Promise<string | null> {
  if (!isTauri()) throw new Error('Salvar pasta requer o app desktop (Tauri).')
  const { mkdir, writeTextFile, exists } = await fs()

  let scenarioDir = project.dirPath
  if (!scenarioDir) {
    const { open } = await dialog()
    const parent = await open({ directory: true, multiple: false, title: 'Escolha onde criar a pasta do cenário' })
    if (!parent || typeof parent !== 'string') return null
    scenarioDir = join(parent.replace(/\\/g, '/'), project.theme, project.meta.id)
  }

  const { files } = toRepoFolder(project)
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(scenarioDir, rel)
    const dir = abs.split('/').slice(0, -1).join('/')
    if (!(await exists(dir))) await mkdir(dir, { recursive: true })
    await writeTextFile(abs, content)
  }
  return scenarioDir
}

/** Export the single runtime bundle JSON: a Save dialog under Tauri, a browser
 *  download on the web. */
export async function exportRuntimeBundle(project: Project): Promise<void> {
  const json = JSON.stringify(toRuntimeBundle(project), null, 2)
  const filename = `${project.meta.id || 'scenario'}.json`

  if (isTauri()) {
    const { save } = await dialog()
    const { writeTextFile } = await fs()
    const target = await save({ defaultPath: filename, filters: [{ name: 'JSON', extensions: ['json'] }] })
    if (target) await writeTextFile(target, json)
    return
  }
  downloadText(filename, json, 'application/json')
}

/** Import a runtime bundle from pasted/loaded JSON text. */
export function importRuntimeBundleText(text: string): Project {
  const parsed = JSON.parse(text) as Record<string, unknown>
  return fromRuntimeBundle(parsed)
}

/** Import from a terminal share link or raw token. Accepts a full URL with a
 *  `?scenario64=` param or a bare token; decodes with the engine's decodeBundle
 *  (same codec the terminal uses) and rebuilds the project. */
export function importShareLink(input: string): Project {
  let token = input.trim()
  const m = token.match(/[?&]scenario64=([^&\s#]+)/)
  if (m) token = m[1]
  const bundle = decodeBundle(token) as Record<string, unknown>
  if (!bundle || typeof bundle !== 'object') throw new Error('Token não decodifica para um cenário.')
  return fromRuntimeBundle(bundle)
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
