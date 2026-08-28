// Filesystem boundary for the web editor.
// - Chromium: File System Access API (open/save a real folder, mesa root).
// - All browsers: zip of the versionable folder + JSON runtime bundle.
// - Fallback open: `<input webkitdirectory>` (Firefox/Safari).

import { decodeBundle } from 'rpgterm-engine'
import type { Project } from '../model/types'
import { fromRepoFolder, toRepoFolder, toRuntimeBundle, fromRuntimeBundle } from '../model/serialize'
import { locateScenarioRoot, omitJunk, stripPrefix } from './folder'
import { packZip, unpackZip } from './zip'
import {
  canPickDirectory,
  ensurePermission,
  idbDelHandle,
  idbGetHandle,
  idbPutHandle,
  isAbort,
  MESA_HANDLE_KEY,
  readDirectoryTree,
  SCENARIO_HANDLE_KEY,
  writeDirectoryTree
} from './fsa'

export { canPickDirectory }

let scenarioHandle: FileSystemDirectoryHandle | null = null
let mesaHandle: FileSystemDirectoryHandle | null = null
let restored = false

async function restoreHandles(): Promise<void> {
  if (restored) return
  restored = true
  scenarioHandle = await idbGetHandle(SCENARIO_HANDLE_KEY)
  mesaHandle = await idbGetHandle(MESA_HANDLE_KEY)
}

export async function clearScenarioDir(): Promise<void> {
  await restoreHandles()
  scenarioHandle = null
  await idbDelHandle(SCENARIO_HANDLE_KEY)
}

async function bindScenarioDir(handle: FileSystemDirectoryHandle): Promise<void> {
  scenarioHandle = handle
  await idbPutHandle(SCENARIO_HANDLE_KEY, handle)
}

async function bindMesaDir(handle: FileSystemDirectoryHandle): Promise<void> {
  mesaHandle = handle
  await idbPutHandle(MESA_HANDLE_KEY, handle)
}

export function projectFromEntries(entries: Record<string, string>): Project {
  const cleaned = omitJunk(entries)
  const { prefix, theme } = locateScenarioRoot(Object.keys(cleaned))
  return fromRepoFolder(stripPrefix(cleaned, prefix), theme ?? 'ibm')
}

export async function projectFromFileList(list: Iterable<File>): Promise<Project> {
  const entries: Record<string, string> = {}
  for (const file of list) {
    const rel = (file.webkitRelativePath || file.name).replace(/\\/g, '/')
    entries[rel] = await file.text()
  }
  return projectFromEntries(entries)
}

export async function importRepoZip(data: Uint8Array): Promise<Project> {
  return projectFromEntries(unpackZip(data))
}

export function importRuntimeBundleText(text: string): Project {
  const parsed = JSON.parse(text) as Record<string, unknown>
  return fromRuntimeBundle(parsed)
}

export function importShareLink(input: string): Project {
  let token = input.trim()
  const m = token.match(/[?&]scenario64=([^&\s#]+)/)
  if (m) token = m[1]
  const bundle = decodeBundle(token) as Record<string, unknown>
  if (!bundle || typeof bundle !== 'object') throw new Error('Token não decodifica para um cenário.')
  return fromRuntimeBundle(bundle)
}

export type OpenFolderResult =
  | { kind: 'project'; project: Project }
  | { kind: 'abort' }
  | { kind: 'input' }

/** Native directory picker when available; otherwise the caller should fall
 *  back to a hidden `<input webkitdirectory>`. */
export async function openScenarioFolder(): Promise<OpenFolderResult> {
  if (!canPickDirectory()) return { kind: 'input' }
  try {
    const handle = await window.showDirectoryPicker({ id: 'scenario-forge-open', mode: 'read' })
    if (!(await ensurePermission(handle, 'read'))) return { kind: 'abort' }
    const project = projectFromEntries(await readDirectoryTree(handle))
    await bindScenarioDir(handle)
    project.dirPath = handle.name
    return { kind: 'project', project }
  } catch (e) {
    if (isAbort(e)) return { kind: 'abort' }
    throw e
  }
}

export type SaveResult = { label: string; downloaded: boolean; mesaName?: string } | null

/** Write to the bound folder (or pick a parent and create `<theme>/<id>/`).
 *  Browsers without the directory picker download a zip instead. */
export async function saveScenarioFolder(project: Project): Promise<SaveResult> {
  await restoreHandles()
  const { files, suggestedDir } = toRepoFolder(project)

  if (!canPickDirectory()) {
    downloadBlob(`${project.meta.id || 'scenario'}.zip`, packZip(files), 'application/zip')
    return { label: suggestedDir + '.zip', downloaded: true }
  }

  try {
    if (scenarioHandle && (await ensurePermission(scenarioHandle, 'readwrite'))) {
      await writeDirectoryTree(scenarioHandle, files)
      return { label: scenarioHandle.name, downloaded: false }
    }
    const parent = await window.showDirectoryPicker({
      id: 'scenario-forge-save',
      mode: 'readwrite'
    })
    if (!(await ensurePermission(parent, 'readwrite'))) return null
    const themeDir = await parent.getDirectoryHandle(project.theme, { create: true })
    const scenarioDir = await themeDir.getDirectoryHandle(project.meta.id, { create: true })
    await writeDirectoryTree(scenarioDir, files)
    await bindScenarioDir(scenarioDir)
    return { label: suggestedDir, downloaded: false }
  } catch (e) {
    if (isAbort(e)) return null
    throw e
  }
}

export function exportRepoZip(project: Project): void {
  const { files } = toRepoFolder(project)
  downloadBlob(`${project.meta.id || 'scenario'}.zip`, packZip(files), 'application/zip')
}

export async function exportRuntimeBundle(project: Project): Promise<void> {
  const json = JSON.stringify(toRuntimeBundle(project), null, 2)
  downloadBlob(`${project.meta.id || 'scenario'}.json`, json, 'application/json')
}

export async function pickMesaRoot(): Promise<string | null> {
  if (!canPickDirectory()) return null
  try {
    const handle = await window.showDirectoryPicker({
      id: 'scenario-forge-mesa',
      mode: 'readwrite'
    })
    if (!(await ensurePermission(handle, 'readwrite'))) return null
    await bindMesaDir(handle)
    return handle.name
  } catch (e) {
    if (isAbort(e)) return null
    throw e
  }
}

/** Write under `<mesaRoot>/<theme>/<id>/` when a mesa folder is bound.
 *  Otherwise downloads the versionable zip. */
export async function saveScenarioToMesa(project: Project): Promise<SaveResult> {
  await restoreHandles()
  const { files, suggestedDir } = toRepoFolder(project)

  if (!canPickDirectory()) {
    downloadBlob(`${project.theme}-${project.meta.id || 'scenario'}.zip`, packZip(files), 'application/zip')
    return { label: suggestedDir + '.zip', downloaded: true }
  }

  try {
    let root = mesaHandle
    if (!root || !(await ensurePermission(root, 'readwrite'))) {
      const picked = await window.showDirectoryPicker({
        id: 'scenario-forge-mesa',
        mode: 'readwrite'
      })
      if (!(await ensurePermission(picked, 'readwrite'))) return null
      await bindMesaDir(picked)
      root = picked
    }
    if (!root) return null
    const themeDir = await root.getDirectoryHandle(project.theme, { create: true })
    const scenarioDir = await themeDir.getDirectoryHandle(project.meta.id, { create: true })
    await writeDirectoryTree(scenarioDir, files)
    await bindScenarioDir(scenarioDir)
    return { label: suggestedDir, downloaded: false, mesaName: root.name }
  } catch (e) {
    if (isAbort(e)) return null
    throw e
  }
}

function downloadBlob(filename: string, data: string | Uint8Array, mime: string) {
  const blob = new Blob([data as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
