const DB_NAME = 'scenario-forge'
const STORE = 'handles'
export const SCENARIO_HANDLE_KEY = 'scenario'
export const MESA_HANDLE_KEY = 'mesa'

export function canPickDirectory(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export function isAbort(e: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  )
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
  })
}

export async function idbPutHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(handle, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* private mode / jsdom */
  }
}

export async function idbGetHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb()
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return handle
  } catch {
    return null
  }
}

export async function idbDelHandle(key: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* ignore */
  }
}

export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  mode: 'read' | 'readwrite'
): Promise<boolean> {
  const opts = { mode } as FileSystemHandlePermissionDescriptor
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true
    return (await handle.requestPermission(opts)) === 'granted'
  } catch {
    return false
  }
}

export async function readDirectoryTree(root: FileSystemDirectoryHandle): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const walk = async (dir: FileSystemDirectoryHandle, prefix: string) => {
    for await (const entry of dir.values()) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.kind === 'directory') await walk(entry, rel)
      else if (entry.kind === 'file') {
        const file = await entry.getFile()
        out[rel] = await file.text()
      }
    }
  }
  await walk(root, '')
  return out
}

export async function writeDirectoryTree(
  root: FileSystemDirectoryHandle,
  files: Record<string, string>
): Promise<void> {
  for (const [rel, content] of Object.entries(files)) {
    const parts = rel.split('/').filter(Boolean)
    const filename = parts.pop()
    if (!filename) continue
    let dir = root
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true })
    }
    const fh = await dir.getFileHandle(filename, { create: true })
    const writable = await fh.createWritable()
    await writable.write(content)
    await writable.close()
  }
}
