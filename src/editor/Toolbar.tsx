import { useEffect, useRef, useState } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import {
  isTauri,
  openScenarioFolder,
  saveScenarioFolder,
  saveScenarioToMesa,
  pickMesaRoot,
  exportRuntimeBundle,
  importRuntimeBundleText,
  importShareLink
} from '../fs/adapter'
import { VersionBadge } from '../preview/PreviewPanel'
import { ENGINE_VERSION, compareVersions, fetchPublishedEngineVersion } from '../preview/engineVersion'
import { promptText, confirmDialog, alertDialog } from '../ui/dialog'

export function Toolbar({
  onShowScenario,
  onPreview,
  onTemplates
}: {
  onShowScenario: () => void
  onPreview: () => void
  onTemplates: () => void
}) {
  const t = useT()
  const project = useStore((s) => s.project)
  const dirty = useStore((s) => s.dirty)
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const addLang = useStore((s) => s.addLang)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)
  const markSaved = useStore((s) => s.markSaved)
  const locale = useStore((s) => s.locale)
  const setLocale = useStore((s) => s.setLocale)
  const mesaRoot = useStore((s) => s.mesaRoot)
  const setMesaRoot = useStore((s) => s.setMesaRoot)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const fileInput = useRef<HTMLInputElement>(null)
  const [engineReport, setEngineReport] = useState(() => compareVersions(ENGINE_VERSION, null))

  useEffect(() => {
    const ac = new AbortController()
    fetchPublishedEngineVersion(ac.signal).then((published) => {
      setEngineReport(compareVersions(ENGINE_VERSION, published))
    })
    return () => ac.abort()
  }, [])

  const tauri = isTauri()
  const langs = Object.keys(project.translations)
  const discard = { okLabel: t('Descartar', 'Discard'), cancelLabel: t('Cancelar', 'Cancel') }

  const handleOpen = async () => {
    try {
      const p = await openScenarioFolder()
      if (p) {
        loadProject(p)
        onShowScenario()
      }
    } catch (e) {
      alertDialog({ title: t('Erro ao abrir', 'Open error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleSave = async () => {
    try {
      const dir = await saveScenarioFolder(project)
      if (dir) markSaved(dir)
    } catch (e) {
      alertDialog({ title: t('Erro ao salvar', 'Save error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        loadProject(importRuntimeBundleText(String(reader.result)))
        onShowScenario()
      } catch (e) {
        alertDialog({ title: t('Bundle inválido', 'Invalid bundle'), message: e instanceof Error ? e.message : String(e) })
      }
    }
    reader.readAsText(file)
  }

  const handleImportLink = async () => {
    if (dirty && !(await confirmDialog({ title: t('Importar link', 'Import link'), message: t('Descartar alterações não salvas?', 'Discard unsaved changes?'), ...discard })))
      return
    const input = await promptText({
      title: t('Importar de link', 'Import from link'),
      message: t('Cole o link de compartilhamento (…?scenario64=…) ou o token', 'Paste the share link (…?scenario64=…) or the token'),
      placeholder: 'https://…/?scenario64=eyJ0aGVtZ…'
    })
    if (!input || !input.trim()) return
    try {
      loadProject(importShareLink(input))
      onShowScenario()
    } catch (e) {
      alertDialog({ title: t('Link inválido', 'Invalid link'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleNew = async () => {
    if (!dirty || (await confirmDialog({ title: t('Novo cenário', 'New scenario'), message: t('Descartar alterações não salvas?', 'Discard unsaved changes?'), ...discard })))
      newProject()
  }

  const handleTemplates = async () => {
    if (!dirty || (await confirmDialog({ title: t('Novo de template', 'New from template'), message: t('Descartar alterações não salvas?', 'Discard unsaved changes?'), ...discard })))
      onTemplates()
  }

  const handleAddLang = async () => {
    const code = await promptText({
      title: t('Novo idioma', 'New language'),
      message: t('Código de 2 letras (ex.: pt, es, fr)', '2-letter code (e.g. pt, es, fr)'),
      placeholder: 'pt',
      validate: (v) => (/^[a-z]{2}$/.test(v.trim()) ? null : t('Use exatamente 2 letras minúsculas.', 'Use exactly 2 lowercase letters.'))
    })
    if (code) addLang(code.trim())
  }

  const handleMesa = async () => {
    try {
      let root = mesaRoot
      if (!root) {
        root = await pickMesaRoot()
        if (!root) return
        setMesaRoot(root)
      }
      const dir = await saveScenarioToMesa(project, root)
      markSaved(dir)
    } catch (e) {
      alertDialog({ title: t('Erro ao salvar na mesa', 'Save-to-table error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handlePickMesa = async () => {
    try {
      const root = await pickMesaRoot()
      if (root) setMesaRoot(root)
    } catch (e) {
      alertDialog({ title: t('Erro', 'Error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  // Ctrl/Cmd+S → salvar pasta (desktop) ou exportar bundle (web).
  // Ctrl/Cmd+Z / Shift+Z → undo/redo, unless the event came from a field
  // (those keep native text undo).
  const projectRef = useRef(project)
  projectRef.current = project
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const field = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const p = projectRef.current
        if (tauri) {
          saveScenarioFolder(p)
            .then((dir) => dir && markSaved(dir))
            .catch((err) =>
              alertDialog({ title: t('Erro ao salvar', 'Save error'), message: err instanceof Error ? err.message : String(err) })
            )
        } else {
          exportRuntimeBundle(p)
        }
        return
      }
      if (field) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tauri, markSaved, undo, redo])

  const desktopOnly = tauri ? '' : t('Requer o app desktop', 'Requires the desktop app')

  return (
    <div className="toolbar">
      <span className="brand">▒ scenario-forge</span>

      <button onClick={handleNew}>{t('Novo', 'New')}</button>
      <button onClick={handleTemplates}>{t('Templates', 'Templates')}</button>
      <button onClick={handleOpen} disabled={!tauri} title={desktopOnly}>
        {t('Abrir pasta', 'Open folder')}
      </button>
      <button className="primary" onClick={handleSave} disabled={!tauri} title={desktopOnly}>
        {t('Salvar pasta', 'Save folder')}
      </button>
      <button
        onClick={handleMesa}
        disabled={!tauri}
        title={
          mesaRoot
            ? mesaRoot
            : t('Escolhe rpgterm/src/themes/scenarios na primeira vez', 'Pick rpgterm/src/themes/scenarios the first time')
        }
      >
        {t('Salvar na mesa', 'Save to table')}
      </button>
      <button onClick={handlePickMesa} disabled={!tauri} title={desktopOnly}>
        {t('Pasta da mesa…', 'Table folder…')}
      </button>
      <button onClick={undo} disabled={undoStack.length === 0} title="Ctrl/Cmd+Z">
        {t('Desfazer', 'Undo')}
      </button>
      <button onClick={redo} disabled={redoStack.length === 0} title="Ctrl/Cmd+Shift+Z">
        {t('Refazer', 'Redo')}
      </button>

      <span className="sep" />

      <button onClick={() => exportRuntimeBundle(project)}>{t('Exportar bundle', 'Export bundle')}</button>
      <button onClick={() => fileInput.current?.click()}>{t('Importar bundle', 'Import bundle')}</button>
      <button onClick={handleImportLink}>{t('Importar link', 'Import link')}</button>

      <span className="sep" />

      <button className="primary" onClick={onPreview}>▶ {t('Preview', 'Preview')}</button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImportFile(f)
          e.target.value = ''
        }}
      />

      <span className="sep" />

      <label htmlFor="lang" className="muted">{t('Idioma do cenário:', 'Scenario language:')}</label>
      <select
        id="lang"
        value={lang}
        style={{ width: 'auto' }}
        onChange={(e) => {
          if (e.target.value === '__add') handleAddLang()
          else setLang(e.target.value)
        }}
      >
        <option value="base">base</option>
        {langs.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
        <option value="__add">{t('+ idioma…', '+ language…')}</option>
      </select>

      <span className="spacer" />
      <VersionBadge report={engineReport} />
      {dirty && <span className="dot" title={t('Alterações não salvas', 'Unsaved changes')}>●</span>}
      <button
        className="locale-toggle"
        title={t('Idioma do editor', 'Editor language')}
        onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
      >
        🌐 {locale.toUpperCase()}
      </button>
      <span className="muted">{tauri ? 'desktop' : t('web (export/import só por bundle)', 'web (export/import via bundle only)')}</span>
    </div>
  )
}
