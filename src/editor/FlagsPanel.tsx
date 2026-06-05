import { useStore } from '../model/store'
import { useT } from '../i18n'
import { FLAG_GROUPS, coerceFlag, type FlagDef } from '../model/flags'
import { isFlagCapable } from '../model/vfs'
import type { FileMeta } from '../model/types'

// Flags whose engine default is "true unless explicitly false" — they need a
// 3-way control (padrão / sim / não) instead of a plain checkbox.
const TRISTATE = new Set(['crackable', 'decryptGame'])

function Field({ def, path, meta }: { def: FlagDef; path: string; meta: FileMeta }) {
  const t = useT()
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
        <option value="">{t('(padrão)', '(default)')}</option>
        <option value="true">{t('sim', 'yes')}</option>
        <option value="false">{t('não', 'no')}</option>
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
        <span className="name">{t(def.label.pt, def.label.en)}</span>
        {def.type === 'bool' && !TRISTATE.has(def.key) ? (
          control
        ) : def.defaultHint ? (
          <span className="hint">def: {def.defaultHint}</span>
        ) : null}
      </div>
      {def.type !== 'bool' || TRISTATE.has(def.key) ? control : null}
      <div className="help">{t(def.help.pt, def.help.en)}</div>
    </div>
  )
}

export function FlagsPanel() {
  const t = useT()
  const selectedPath = useStore((s) => s.selectedPath)
  const lang = useStore((s) => s.lang)
  const file = useStore((s) => s.project.files.find((f) => f.path === s.selectedPath))

  if (!selectedPath || !file) {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">{t('Selecione um arquivo de dados para configurar os flags.', 'Select a data file to configure its flags.')}</p>
      </div>
    )
  }
  if (lang !== 'base') {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">{t('Os flags vivem no arquivo base. Volte ao idioma “base” para editá-los.', 'Flags live on the base file. Switch back to the “base” language to edit them.')}</p>
      </div>
    )
  }
  if (!isFlagCapable(selectedPath)) {
    return (
      <div className="col flags">
        <p className="col-title">Flags</p>
        <p className="muted">
          {t('Arquivos ', 'Files ')}<code>.md</code>
          {t(' são tratados como prosa. Para usar flags de bloqueio, use um arquivo de dados (',
            ' are treated as prose. To use lock flags, use a data file (')}
          <code>.dat</code>).
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
            <summary>{t(g.label.pt, g.label.en)}</summary>
            {g.help && <div className="group-help">{t(g.help.pt, g.help.en)}</div>}
            {visible.map((f) => (
              <Field key={f.key} def={f} path={selectedPath} meta={meta} />
            ))}
          </details>
        )
      })}
    </div>
  )
}
