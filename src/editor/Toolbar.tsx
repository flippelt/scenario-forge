import { useRef } from 'react'
import { useStore } from '../model/store'
import {
  isTauri,
  openScenarioFolder,
  saveScenarioFolder,
  exportRuntimeBundle,
  importRuntimeBundleText
} from '../fs/adapter'
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
  const project = useStore((s) => s.project)
  const dirty = useStore((s) => s.dirty)
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const addLang = useStore((s) => s.addLang)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)
  const markSaved = useStore((s) => s.markSaved)
  const fileInput = useRef<HTMLInputElement>(null)

  const tauri = isTauri()
  const langs = Object.keys(project.translations)

  const handleOpen = async () => {
    try {
      const p = await openScenarioFolder()
      if (p) {
        loadProject(p)
        onShowScenario()
      }
    } catch (e) {
      alertDialog({ title: 'Erro ao abrir', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleSave = async () => {
    try {
      const dir = await saveScenarioFolder(project)
      if (dir) markSaved(dir)
    } catch (e) {
      alertDialog({ title: 'Erro ao salvar', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        loadProject(importRuntimeBundleText(String(reader.result)))
        onShowScenario()
      } catch (e) {
        alertDialog({ title: 'Bundle inválido', message: e instanceof Error ? e.message : String(e) })
      }
    }
    reader.readAsText(file)
  }

  const handleNew = async () => {
    if (!dirty || (await confirmDialog({ title: 'Novo cenário', message: 'Descartar alterações não salvas?', okLabel: 'Descartar' })))
      newProject()
  }

  const handleTemplates = async () => {
    if (!dirty || (await confirmDialog({ title: 'Novo de template', message: 'Descartar alterações não salvas?', okLabel: 'Descartar' })))
      onTemplates()
  }

  const handleAddLang = async () => {
    const code = await promptText({
      title: 'Novo idioma',
      message: 'Código de 2 letras (ex.: pt, es, fr)',
      placeholder: 'pt',
      validate: (v) => (/^[a-z]{2}$/.test(v.trim()) ? null : 'Use exatamente 2 letras minúsculas.')
    })
    if (code) addLang(code.trim())
  }

  return (
    <div className="toolbar">
      <span className="brand">▒ scenario-forge</span>

      <button onClick={handleNew}>Novo</button>
      <button onClick={handleTemplates}>Templates</button>
      <button onClick={handleOpen} disabled={!tauri} title={tauri ? '' : 'Requer o app desktop'}>
        Abrir pasta
      </button>
      <button className="primary" onClick={handleSave} disabled={!tauri} title={tauri ? '' : 'Requer o app desktop'}>
        Salvar pasta
      </button>

      <span className="sep" />

      <button onClick={() => exportRuntimeBundle(project)}>Exportar bundle</button>
      <button onClick={() => fileInput.current?.click()}>Importar bundle</button>

      <span className="sep" />

      <button className="primary" onClick={onPreview}>▶ Preview</button>
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

      <label htmlFor="lang" className="muted">Idioma:</label>
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
        <option value="__add">+ idioma…</option>
      </select>

      <span className="spacer" />
      {dirty && <span className="dot" title="Alterações não salvas">●</span>}
      <span className="muted">{tauri ? 'desktop' : 'web (export/import só por bundle)'}</span>
    </div>
  )
}
