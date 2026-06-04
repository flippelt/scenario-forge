// Single source of truth for the open scenario. The store is plain data +
// mutators; serializers (./serialize.ts) read project state to export, and the
// FS adapter (../fs/adapter.ts) loads/saves it. Editing language is tracked
// here so the editor edits either the base file or a translated body.

import { create } from 'zustand'
import type {
  Project,
  ScenarioMeta,
  FileNode,
  FrontMatterValue,
  SystemId
} from './types'
import { emptyProject } from './types'
import { normalizeVfsPath } from './vfs'

export type EditLang = 'base' | string

interface State {
  project: Project
  selectedPath: string | null
  /** 'base' edits files[].content + flags; a lang code edits a translated body. */
  lang: EditLang
  dirty: boolean

  loadProject: (p: Project) => void
  newProject: (theme?: SystemId) => void
  markSaved: (dirPath: string) => void

  setTheme: (theme: SystemId) => void
  setMeta: (patch: Partial<ScenarioMeta>) => void
  replaceMeta: (meta: ScenarioMeta) => void

  setLang: (lang: EditLang) => void
  addLang: (lang: string) => void

  select: (path: string | null) => void
  addFile: (path: string, locked?: boolean) => void
  renameFile: (oldPath: string, newPath: string) => void
  deleteFile: (path: string) => void

  setContent: (path: string, content: string) => void
  setFlag: (path: string, key: string, value: FrontMatterValue) => void
  unsetFlag: (path: string, key: string) => void
}

const sortFiles = (files: FileNode[]) =>
  [...files].sort((a, b) => a.path.localeCompare(b.path))

export const useStore = create<State>((set, get) => ({
  project: emptyProject(),
  selectedPath: null,
  lang: 'base',
  dirty: false,

  loadProject: (p) => set({ project: p, selectedPath: null, lang: 'base', dirty: false }),
  newProject: (theme) =>
    set({ project: emptyProject(theme), selectedPath: null, lang: 'base', dirty: false }),
  markSaved: (dirPath) =>
    set((s) => ({ project: { ...s.project, dirPath }, dirty: false })),

  setTheme: (theme) =>
    set((s) => ({ project: { ...s.project, theme }, dirty: true })),
  setMeta: (patch) =>
    set((s) => ({ project: { ...s.project, meta: { ...s.project.meta, ...patch } }, dirty: true })),
  replaceMeta: (meta) =>
    set((s) => ({ project: { ...s.project, meta }, dirty: true })),

  setLang: (lang) => set({ lang }),
  addLang: (lang) =>
    set((s) => {
      if (lang === 'base' || s.project.translations[lang]) return { lang }
      return {
        lang,
        dirty: true,
        project: {
          ...s.project,
          translations: { ...s.project.translations, [lang]: {} }
        }
      }
    }),

  select: (path) => set({ selectedPath: path }),

  addFile: (rawPath, locked = false) =>
    set((s) => {
      const path = normalizeVfsPath(rawPath)
      if (s.project.files.some((f) => f.path === path)) return {}
      const node: FileNode = { path, content: '', meta: locked ? { locked: true } : {} }
      return {
        selectedPath: path,
        lang: 'base',
        dirty: true,
        project: { ...s.project, files: sortFiles([...s.project.files, node]) }
      }
    }),

  renameFile: (oldPath, newPathRaw) =>
    set((s) => {
      const newPath = normalizeVfsPath(newPathRaw)
      if (oldPath === newPath) return {}
      const files = s.project.files.map((f) =>
        f.path === oldPath ? { ...f, path: newPath } : f
      )
      const translations = { ...s.project.translations }
      for (const lang of Object.keys(translations)) {
        if (translations[lang][oldPath] != null) {
          const { [oldPath]: body, ...rest } = translations[lang]
          translations[lang] = { ...rest, [newPath]: body }
        }
      }
      return {
        dirty: true,
        selectedPath: s.selectedPath === oldPath ? newPath : s.selectedPath,
        project: { ...s.project, files: sortFiles(files), translations }
      }
    }),

  deleteFile: (path) =>
    set((s) => {
      const translations = { ...s.project.translations }
      for (const lang of Object.keys(translations)) {
        if (translations[lang][path] != null) {
          const { [path]: _drop, ...rest } = translations[lang]
          translations[lang] = rest
        }
      }
      return {
        dirty: true,
        selectedPath: s.selectedPath === path ? null : s.selectedPath,
        project: {
          ...s.project,
          files: s.project.files.filter((f) => f.path !== path),
          translations
        }
      }
    }),

  setContent: (path, content) =>
    set((s) => {
      const { lang } = get()
      if (lang === 'base') {
        return {
          dirty: true,
          project: {
            ...s.project,
            files: s.project.files.map((f) => (f.path === path ? { ...f, content } : f))
          }
        }
      }
      const byLang = { ...(s.project.translations[lang] ?? {}), [path]: content }
      return {
        dirty: true,
        project: {
          ...s.project,
          translations: { ...s.project.translations, [lang]: byLang }
        }
      }
    }),

  setFlag: (path, key, value) =>
    set((s) => ({
      dirty: true,
      project: {
        ...s.project,
        files: s.project.files.map((f) =>
          f.path === path ? { ...f, meta: { ...f.meta, [key]: value } } : f
        )
      }
    })),

  unsetFlag: (path, key) =>
    set((s) => ({
      dirty: true,
      project: {
        ...s.project,
        files: s.project.files.map((f) => {
          if (f.path !== path) return f
          const { [key]: _drop, ...rest } = f.meta
          return { ...f, meta: rest }
        })
      }
    }))
}))
