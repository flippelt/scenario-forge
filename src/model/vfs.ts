// Virtual filesystem helpers. buildVfs mirrors the engine's buildFilesystem
// (themes/index.js): directories are inferred from file paths, children are
// sorted, and a file node is `{ type:'file', content, ...meta }`. We omit the
// runtime-only decryptTarget pick — the engine recomputes it at load, so the
// bundle stays clean. A separate tree builder drives the editor's file panel.

import type { FileNode } from './types'

export interface VfsDir {
  type: 'dir'
  children: string[]
}
export interface VfsFile {
  type: 'file'
  content: string
  [flag: string]: unknown
}
export type Vfs = Record<string, VfsDir | VfsFile>

/** Build the path-keyed VFS the engine consumes. Faithful to buildFilesystem
 *  minus the load-time decryptTarget pick (recomputed at runtime). */
export function buildVfs(files: FileNode[]): Vfs {
  const fs: Vfs = { '/': { type: 'dir', children: [] } }
  const ensureDir = (p: string): VfsDir => {
    const k = p === '' ? '/' : p
    if (!fs[k]) fs[k] = { type: 'dir', children: [] }
    return fs[k] as VfsDir
  }
  const addChild = (dirPath: string, name: string) => {
    const d = ensureDir(dirPath)
    if (!d.children.includes(name)) d.children.push(name)
  }

  for (const { path, content, meta } of files) {
    const parts = path.split('/').filter(Boolean)
    let cur = ''
    for (let i = 0; i < parts.length - 1; i++) {
      addChild(cur === '' ? '/' : cur, parts[i])
      cur = cur + '/' + parts[i]
      ensureDir(cur)
    }
    addChild(cur === '' ? '/' : cur, parts[parts.length - 1])
    fs[path] = { type: 'file', content, ...meta }
  }

  for (const node of Object.values(fs)) {
    if (node.type === 'dir') node.children.sort()
  }
  return fs
}

// --- editor tree (display) -------------------------------------------------

export interface TreeNode {
  name: string
  path: string
  type: 'dir' | 'file'
  children: TreeNode[]
}

/** Derive a nested tree (for the file panel) from the flat file list. Dirs are
 *  synthesised from path segments; everything is sorted dirs-first then name. */
export function buildTree(files: FileNode[]): TreeNode {
  const root: TreeNode = { name: '/', path: '/', type: 'dir', children: [] }
  const dirByPath = new Map<string, TreeNode>([['/', root]])

  const ensureDir = (path: string): TreeNode => {
    if (dirByPath.has(path)) return dirByPath.get(path)!
    const parts = path.split('/').filter(Boolean)
    const name = parts[parts.length - 1]
    const parentPath = '/' + parts.slice(0, -1).join('/')
    const parent = ensureDir(parentPath === '/' ? '/' : parentPath)
    const node: TreeNode = { name, path, type: 'dir', children: [] }
    parent.children.push(node)
    dirByPath.set(path, node)
    return node
  }

  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = f.path.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/')
    const parent = ensureDir(parentPath === '/' ? '/' : parentPath)
    parent.children.push({
      name: parts[parts.length - 1],
      path: f.path,
      type: 'file',
      children: []
    })
  }

  const sortRec = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    n.children.forEach(sortRec)
  }
  sortRec(root)
  return root
}

/** Normalise any user path to a leading-slash absolute path, no trailing slash. */
export function normalizeVfsPath(p: string): string {
  const parts = p.split('/').filter((s) => s && s !== '.')
  const out: string[] = []
  for (const seg of parts) {
    if (seg === '..') out.pop()
    else out.push(seg)
  }
  return '/' + out.join('/')
}

/** Front-matter is only meaningful on real `.dat`-style data files, but the
 *  engine honours flags on any locked file. We treat `.md` as prose (flags
 *  hidden in the UI) and everything else as flag-capable. */
export function isFlagCapable(path: string): boolean {
  return !path.toLowerCase().endsWith('.md')
}

export function fileExt(path: string): string {
  const name = path.split('/').pop() ?? ''
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}
