import { useEffect, useRef, useState } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import {
  canPickDirectory,
  clearScenarioDir,
  openScenarioFolder,
  saveScenarioFolder,
  saveScenarioToMesa,
  pickMesaRoot,
  exportRuntimeBundle,
  exportRepoZip,
  importRuntimeBundleText,
  importRepoZip,
  importShareLink,
  projectFromFileList
} from '../fs/adapter'
import { VersionBadge } from '../preview/PreviewPanel'
import { ENGINE_VERSION, compareVersions, fetchPublishedEngineVersion } from '../preview/engineVersion'
import { promptText, confirmDialog, alertDialog } from '../ui/dialog'

export function Toolbar({
  locked,
  onUnlock,
  onLock,
  onFresh,
  onExisting,
  onShowScenario,
  onPreview,
  onTemplates
}: {
  locked: boolean
  onUnlock: () => void
  onLock: () => void
  onFresh: () => void
  onExisting: () => void
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
  const folderInput = useRef<HTMLInputElement>(null)
  const [engineReport, setEngineReport] = useState(() => compareVersions(ENGINE_VERSION, null))
  const native = canPickDirectory()

  useEffect(() => {
    const ac = new AbortController()
    fetchPublishedEngineVersion(ac.signal).then((published) => {
      setEngineReport(compareVersions(ENGINE_VERSION, published))
    })
    return () => ac.abort()
  }, [])

  const langs = Object.keys(project.translations)
  const discard = { okLabel: t('Descartar', 'Discard'), cancelLabel: t('Cancelar', 'Cancel') }

  const adopt = (p: typeof project) => {
    loadProject(p)
    onExisting()
    onShowScenario()
  }

  const handleOpen = async () => {
    try {
      const result = await openScenarioFolder()
      if (result.kind === 'input') {
        folderInput.current?.click()
        return
      }
      if (result.kind === 'project') adopt(result.project)
    } catch (e) {
      alertDialog({ title: t('Erro ao abrir', 'Open error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleOpenFiles = async (list: FileList | File[]) => {
    try {
      await clearScenarioDir()
      adopt(await projectFromFileList(list))
    } catch (e) {
      alertDialog({ title: t('Erro ao abrir', 'Open error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleSave = async (p = project) => {
    try {
      const result = await saveScenarioFolder(p)
      if (result) markSaved(result.label)
    } catch (e) {
      alertDialog({ title: t('Erro ao salvar', 'Save error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      await clearScenarioDir()
      const zip = /\.zip$/i.test(file.name) || /zip/.test(file.type)
      if (zip) {
        adopt(await importRepoZip(new Uint8Array(await file.arrayBuffer())))
      } else {
        adopt(importRuntimeBundleText(await file.text()))
      }
    } catch (e) {
      alertDialog({
        title: t('Arquivo inválido', 'Invalid file'),
        message: e instanceof Error ? e.message : String(e)
      })
    }
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
      await clearScenarioDir()
      adopt(importShareLink(input))
    } catch (e) {
      alertDialog({ title: t('Link inválido', 'Invalid link'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleNew = async () => {
    if (!dirty || (await confirmDialog({ title: t('Novo cenário', 'New scenario'), message: t('Descartar alterações não salvas?', 'Discard unsaved changes?'), ...discard }))) {
      await clearScenarioDir()
      newProject()
      onFresh()
    }
  }

  const handleTemplates = async () => {
    if (!dirty || (await confirmDialog({ title: t('Novo de template', 'New from template'), message: t('Descartar alterações não salvas?', 'Discard unsaved changes?'), ...discard }))) {
      await clearScenarioDir()
      onTemplates()
    }
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
      const result = await saveScenarioToMesa(project)
      if (!result) return
      markSaved(result.label)
      if (result.mesaName) setMesaRoot(result.mesaName)
      if (result.downloaded) {
        alertDialog({
          title: t('Pasta baixada', 'Folder downloaded'),
          message: t(
            `Extraia em rpgterm/src/themes/scenarios/${project.theme}/${project.meta.id}/`,
            `Extract into rpgterm/src/themes/scenarios/${project.theme}/${project.meta.id}/`
          )
        })
      }
    } catch (e) {
      alertDialog({ title: t('Erro ao salvar na mesa', 'Save-to-table error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handlePickMesa = async () => {
    try {
      const root = await pickMesaRoot()
      if (root) setMesaRoot(root)
      else if (!native) {
        alertDialog({
          title: t('Pasta da mesa', 'Table folder'),
          message: t(
            'Escolher a pasta da mesa (gravação direta) precisa do Chrome ou Edge. Neste navegador use Baixar pasta (.zip) e extraia em rpgterm/src/themes/scenarios/.',
            'Picking the table folder (direct write) needs Chrome or Edge. In this browser use Download folder (.zip) and extract into rpgterm/src/themes/scenarios/.'
          )
        })
      }
    } catch (e) {
      alertDialog({ title: t('Erro', 'Error'), message: e instanceof Error ? e.message : String(e) })
    }
  }

  const projectRef = useRef(project)
  projectRef.current = project
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const field = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave(projectRef.current)
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
    // handleSave is stable enough via projectRef; undo/redo/markSaved change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markSaved, undo, redo])

  const saveLabel = native ? t('Salvar pasta', 'Save folder') : t('Baixar pasta (.zip)', 'Download folder (.zip)')
  const mesaHint = native
    ? mesaRoot || t('Escolhe rpgterm/src/themes/scenarios na primeira vez', 'Pick rpgterm/src/themes/scenarios the first time')
    : t('Neste navegador baixa um .zip para extrair na pasta da mesa', 'In this browser downloads a .zip to extract into the table folder')

  return (
    <div className="toolbar">
      <span className="brand">▒ scenario-forge</span>

      {locked ? (
        <button className="primary" type="button" onClick={onUnlock}>
          {t('Editar', 'Edit')}
        </button>
      ) : (
        <button type="button" onClick={onLock}>
          {t('Travar', 'Lock')}
        </button>
      )}

      <button type="button" onClick={() => void handleNew()}>{t('Novo', 'New')}</button>
      <button type="button" onClick={() => void handleTemplates()}>{t('Templates', 'Templates')}</button>
      <button type="button" onClick={() => void handleOpen()}>{t('Abrir pasta', 'Open folder')}</button>
      <button className="primary" type="button" onClick={() => void handleSave()} title="Ctrl/Cmd+S">
        {saveLabel}
      </button>
      <button type="button" onClick={() => void handleMesa()} title={mesaHint}>
        {t('Salvar na mesa', 'Save to table')}
      </button>
      <button
        type="button"
        onClick={() => void handlePickMesa()}
        title={t('Pasta da mesa (rpgterm/src/themes/scenarios)', 'Table folder (rpgterm/src/themes/scenarios)')}
      >
        {t('Pasta da mesa…', 'Table folder…')}
      </button>
      <button type="button" onClick={undo} disabled={undoStack.length === 0} title="Ctrl/Cmd+Z">
        {t('Desfazer', 'Undo')}
      </button>
      <button type="button" onClick={redo} disabled={redoStack.length === 0} title="Ctrl/Cmd+Shift+Z">
        {t('Refazer', 'Redo')}
      </button>

      <span className="sep" />

      <button type="button" onClick={() => exportRuntimeBundle(project)}>{t('Exportar bundle', 'Export bundle')}</button>
      {native && (
        <button type="button" onClick={() => exportRepoZip(project)}>{t('Baixar pasta (.zip)', 'Download folder (.zip)')}</button>
      )}
      <button type="button" onClick={() => fileInput.current?.click()}>{t('Importar', 'Import')}</button>
      <button type="button" onClick={() => void handleImportLink()}>{t('Importar link', 'Import link')}</button>

      <span className="sep" />

      <button className="primary" type="button" onClick={onPreview}>▶ {t('Preview', 'Preview')}</button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json,application/zip,.zip"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleImportFile(f)
          e.target.value = ''
        }}
      />
      <input
        ref={folderInput}
        type="file"
        multiple
        // @ts-expect-error non-standard directory picker, present in Chromium/Firefox/Safari
        webkitdirectory=""
        style={{ display: 'none' }}
        onChange={(e) => {
          const list = e.target.files
          if (list && list.length > 0) void handleOpenFiles(list)
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
          if (e.target.value === '__add') void handleAddLang()
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
        type="button"
        title={t('Idioma do editor', 'Editor language')}
        onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
      >
        🌐 {locale.toUpperCase()}
      </button>
      <span className="muted">{native ? t('web · pasta nativa', 'web · native folder') : 'web'}</span>
    </div>
  )
}
