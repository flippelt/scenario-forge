import { useStore } from '../model/store'
import { FLAG_GROUPS, coerceFlag, type FlagDef } from '../model/flags'
import { isFlagCapable } from '../model/vfs'
import type { FileMeta } from '../model/types'

// Flags whose engine default is "true unless explicitly false" — they need a
// 3-way control (padrão / sim / não) instead of a plain checkbox.
const TRISTATE = new Set(['crackable', 'decryptGame'])

function Field({ def, path, meta }: { def: FlagDef; path: string; meta: FileMeta }) {
  const setFlag = useStore((s) => s.setFlag)
  const unsetFlag = useStore((s) => s.unsetFlag)
  const raw = meta[def.key]

  let control: React.ReactNode
  if (def.type === 'bool' && TRISTATE.has(def.key)) {
    const val = raw === true ? 'true' : raw === false ? 'false' : ''
    control = (
      <select
        value={val}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') unsetFlag(path, def.key)
          else setFlag(path, def.key, v === 'true')
        }}
      >
        <option value="">(padrão)</option>
        <option value="true">sim</option>
        <option value="false">não</option>
      </select>
    )
  } else if (def.type === 'bool') {
    control = (
      <input
        type="checkbox"
        checked={raw === true}
        onChange={(e) => (e.target.checked ? setFlag(path, def.key, true) : unsetFlag(path, def.key))}
      />
    )
  } else if (def.type === 'number') {
    control = (
      <input
        type="number"
        value={raw == null ? '' : String(raw)}
        placeholder={def.placeholder ?? def.defaultHint ?? ''}
        onChange={(e) => {
          if (e.target.value === '') unsetFlag(path, def.key)
          else setFlag(path, def.key, coerceFlag('number', e.target.value))
        }}
      />
    )
  } else {
    control = (
      <input
        type="text"
        value={raw == null ? '' : String(raw)}
        placeholder={def.placeholder ?? def.defaultHint ?? ''}
        onChange={(e) => {
          if (e.target.value === '') unsetFlag(path, def.key)
          else setFlag(path, def.key, e.target.value)
        }}
      />
    )
  }

  return (
    <div className="flag-field">
      <div className="head">
        <span className="name">{def.label}</span>
        {def.type === 'bool' && !TRISTATE.has(def.key) ? (
          control
        ) : def.defaultHint ? (
          <span className="hint">def: {def.defaultHint}</span>
        ) : null}
      </div>
      {def.type !== 'bool' || TRISTATE.has(def.key) ? control : null}
      <div className="help">{def.help}</div>
    </div>
  )
}

export function FlagsPanel() {
  const selectedPath = useStore((s) => s.selectedPath)
  const lang = useStore((s) => s.lang)
  const file = useStore((s) => s.project.files.find((f) => f.path === s.selectedPath))

  if (!selectedPath || !file) {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">Selecione um arquivo de dados para configurar os flags.</p>
      </div>
    )
  }
  if (lang !== 'base') {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">Os flags vivem no arquivo base. Volte ao idioma “base” para editá-los.</p>
      </div>
    )
  }
  if (!isFlagCapable(selectedPath)) {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">
          Arquivos <code>.md</code> são tratados como prosa. Para usar flags de bloqueio,
          use um arquivo de dados (<code>.dat</code>).
        </p>
      </div>
    )
  }

  const meta = file.meta
  return (
    <div className="col flags">
      <p className="col-title">Flags · {selectedPath.split('/').pop()}</p>
      {FLAG_GROUPS.map((g) => {
        const visible = g.fields.filter((f) => !f.when || f.when(meta))
        if (visible.length === 0) return null
        return (
          <details key={g.id} className="flag-group" open={g.id === 'lock'}>
            <summary>{g.label}</summary>
            {g.help && <div className="group-help">{g.help}</div>}
            {visible.map((f) => (
              <Field key={f.key} def={f} path={selectedPath} meta={meta} />
            ))}
          </details>
        )
      })}
    </div>
  )
}
