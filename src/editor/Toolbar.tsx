import { useRef } from 'react'
import { useStore } from '../model/store'
import {
  isTauri,
  openScenarioFolder,
  saveScenarioFolder,
  exportRuntimeBundle,
  importRuntimeBundleText
} from '../fs/adapter'

export function Toolbar({ onShowScenario }: { onShowScenario: () => void }) {
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
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  const handleSave = async () => {
    try {
      const dir = await saveScenarioFolder(project)
      if (dir) markSaved(dir)
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        loadProject(importRuntimeBundleText(String(reader.result)))
        onShowScenario()
      } catch (e) {
        alert('Bundle inválido: ' + (e instanceof Error ? e.message : String(e)))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="toolbar">
      <span className="brand">▒ scenario-forge</span>

      <button onClick={() => { if (!dirty || confirm('Descartar alterações não salvas?')) newProject() }}>
        Novo
      </button>
      <button onClick={handleOpen} disabled={!tauri} title={tauri ? '' : 'Requer o app desktop'}>
        Abrir pasta
      </button>
      <button className="primary" onClick={handleSave} disabled={!tauri} title={tauri ? '' : 'Requer o app desktop'}>
        Salvar pasta
      </button>

      <span className="sep" />

      <button onClick={() => exportRuntimeBundle(project)}>Exportar bundle</button>
      <button onClick={() => fileInput.current?.click()}>Importar bundle</button>
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
          if (e.target.value === '__add') {
            const code = window.prompt('Código do idioma (2 letras, ex.: pt)')
            if (code && /^[a-z]{2}$/.test(code.trim())) addLang(code.trim())
          } else setLang(e.target.value)
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
