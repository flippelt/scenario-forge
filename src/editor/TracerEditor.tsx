import { useStore } from '../model/store'
import type { ScenarioMeta } from '../model/types'

// Friendly editor for the scenario `tracer` block — the ICE/recon timer that a
// watched file arms. Common fields get inputs; the `caught` sub-block (capture
// popups) and any other extra key round-trip preserved (edit in advanced JSON).

type Tracer = Record<string, unknown>

const NUM_FIELDS: { key: string; label: string; def: string }[] = [
  { key: 'seconds', label: 'Segundos até completar', def: '30' },
  { key: 'penalty', label: 'Penalidade', def: '7' },
  { key: 'startAfter', label: 'Começa após (tentativas de graça)', def: '0' },
  { key: 'nocrackSeconds', label: 'Janela menor (arquivo não-crackável)', def: '5' }
]
const STR_FIELDS: { key: string; label: string; ph?: string }[] = [
  { key: 'label', label: 'Rótulo', ph: 'ICE TRACE' },
  { key: 'active', label: 'Texto “rastreio ativo”' },
  { key: 'complete', label: 'Texto “rastreio completo”' },
  { key: 'evaded', label: 'Texto “rastreio evadido”' },
  { key: 'checkAlert', label: 'Alerta de varredura repetida' }
]

export function TracerEditor() {
  const tracer = useStore((s) => s.project.meta.tracer)
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

  if (tracer == null || typeof tracer !== 'object') {
    return (
      <div>
        <p className="help">
          Sem bloco <code>tracer</code>. Arquivos com <code>tracer: true</code> só armam o
          rastreador quando este bloco existe.
        </p>
        <button
          onClick={() =>
            setMeta({ tracer: { seconds: 30, penalty: 7, startAfter: 0, nocrackSeconds: 5, label: 'TRACE' } })
          }
        >
          + adicionar bloco tracer
        </button>
      </div>
    )
  }

  const t = tracer as Tracer
  const update = (patch: Tracer) => {
    const next: Tracer = { ...t, ...patch }
    for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k]
    setMeta({ tracer: next })
  }
  const remove = () => {
    const m = { ...meta } as ScenarioMeta
    delete m.tracer
    replaceMeta(m)
  }

  return (
    <div>
      {NUM_FIELDS.map((f) => (
        <div className="form-row" key={f.key}>
          <label>{f.label}</label>
          <input
            type="number"
            value={t[f.key] == null ? '' : String(t[f.key])}
            placeholder={f.def}
            onChange={(e) => update({ [f.key]: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </div>
      ))}
      {STR_FIELDS.map((f) => (
        <div className="form-row" key={f.key}>
          <label>{f.label}</label>
          <input
            type="text"
            value={t[f.key] == null ? '' : String(t[f.key])}
            placeholder={f.ph}
            onChange={(e) => update({ [f.key]: e.target.value === '' ? undefined : e.target.value })}
          />
        </div>
      ))}
      {'caught' in t && (
        <p className="help">
          O sub-bloco <code>caught</code> (pop-ups da captura) é preservado — edite-o no JSON avançado.
        </p>
      )}
      <button className="dialog-remove" onClick={remove}>
        remover bloco tracer
      </button>
    </div>
  )
}
