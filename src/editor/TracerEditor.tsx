import { useStore } from '../model/store'
import { useT } from '../i18n'
import type { ScenarioMeta } from '../model/types'

// Friendly editor for the scenario `tracer` block — the ICE/recon timer a
// watched file arms. Common fields get inputs; the `caught` sub-block and any
// other extra key round-trip preserved (edit in advanced JSON).

type Tracer = Record<string, unknown>

export function TracerEditor() {
  const t = useT()
  const tracer = useStore((s) => s.project.meta.tracer)
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

  const NUM_FIELDS: { key: string; label: string; def: string }[] = [
    { key: 'seconds', label: t('Segundos até completar', 'Seconds to complete'), def: '30' },
    { key: 'penalty', label: t('Penalidade', 'Penalty'), def: '7' },
    { key: 'startAfter', label: t('Começa após (tentativas de graça)', 'Starts after (grace attempts)'), def: '0' },
    { key: 'nocrackSeconds', label: t('Janela menor (arquivo não-crackável)', 'Shorter window (non-crackable file)'), def: '5' }
  ]
  const STR_FIELDS: { key: string; label: string; ph?: string }[] = [
    { key: 'label', label: t('Rótulo', 'Label'), ph: 'ICE TRACE' },
    { key: 'active', label: t('Texto “rastreio ativo”', '“trace active” text') },
    { key: 'complete', label: t('Texto “rastreio completo”', '“trace complete” text') },
    { key: 'evaded', label: t('Texto “rastreio evadido”', '“trace evaded” text') },
    { key: 'checkAlert', label: t('Alerta de varredura repetida', 'Repeated-scan alert') }
  ]

  if (tracer == null || typeof tracer !== 'object') {
    return (
      <div>
        <p className="help">
          {t('Sem bloco ', 'No ')}<code>tracer</code>
          {t(' block. Arquivos com ', ' block. Files with ')}<code>tracer: true</code>
          {t(' só armam o rastreador quando este bloco existe.', ' only arm the tracer when this block exists.')}
        </p>
        <button
          onClick={() =>
            setMeta({ tracer: { seconds: 30, penalty: 7, startAfter: 0, nocrackSeconds: 5, label: 'TRACE' } })
          }
        >
          {t('+ adicionar bloco tracer', '+ add tracer block')}
        </button>
      </div>
    )
  }

  const tr = tracer as Tracer
  const update = (patch: Tracer) => {
    const next: Tracer = { ...tr, ...patch }
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
            value={tr[f.key] == null ? '' : String(tr[f.key])}
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
            value={tr[f.key] == null ? '' : String(tr[f.key])}
            placeholder={f.ph}
            onChange={(e) => update({ [f.key]: e.target.value === '' ? undefined : e.target.value })}
          />
        </div>
      ))}
      {'caught' in tr && (
        <p className="help">
          {t('O sub-bloco ', 'The ')}<code>caught</code>
          {t(' (pop-ups da captura) é preservado — edite-o no JSON avançado.', ' sub-block (capture pop-ups) is preserved — edit it in advanced JSON.')}
        </p>
      )}
      <button className="dialog-remove" onClick={remove}>
        {t('remover bloco tracer', 'remove tracer block')}
      </button>
    </div>
  )
}
