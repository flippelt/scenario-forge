import { useStore } from '../model/store'
import type { Dialog, DialogResponse, ScenarioMeta } from '../model/types'

// Friendly editor for the `dialog` block — what powers the `query`/`ask`
// commands (e.g. the alien MU/TH/UR database). A response fires when the
// player's words include any of its `match` keywords, printing its `lines`.
// thinking/fallback/empty accept multiple lines (one per row).

// `type` = cor/estilo da linha no terminal. '' e 'normal' são equivalentes.
const RESPONSE_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'normal — cor padrão' },
  { value: 'muted', label: 'muted — apagado (texto secundário)' },
  { value: 'ok', label: 'ok — verde (sucesso/afirmativo)' },
  { value: 'err', label: 'err — vermelho (erro/negação)' }
]

// Stable reference for "no dialog yet". Returning a fresh `{}` from the store
// selector would change identity every render → useSyncExternalStore loops.
const EMPTY_DIALOG: Dialog = {}

// textarea text <-> the engine's string | string[] (single line stays a string).
const toText = (v?: string | string[]) => (Array.isArray(v) ? v.join('\n') : (v ?? ''))
function fromText(t: string): string | string[] | undefined {
  const s = t.replace(/\s+$/, '')
  if (!s) return undefined
  const lines = s.split('\n')
  return lines.length > 1 ? lines : lines[0]
}

export function DialogEditor() {
  // Select the raw stored value (stable ref) and default OUTSIDE the selector.
  const dialog = (useStore((s) => s.project.meta.dialog) ?? EMPTY_DIALOG) as Dialog
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

  const responses = dialog.responses ?? []

  const update = (patch: Partial<Dialog>) => {
    const next: Dialog = { ...dialog, ...patch }
    for (const k of Object.keys(next) as (keyof Dialog)[]) {
      if (next[k] === undefined) delete next[k]
    }
    setMeta({ dialog: next })
  }

  const setResponses = (rs: DialogResponse[]) => update({ responses: rs.length ? rs : undefined })
  const patchResponse = (i: number, patch: Partial<DialogResponse>) =>
    setResponses(responses.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const removeDialog = () => {
    const next = { ...meta } as ScenarioMeta
    delete next.dialog
    replaceMeta(next)
  }

  const hasAny =
    !!dialog.thinking || !!dialog.fallback || !!dialog.empty || responses.length > 0

  return (
    <div className="dialog-editor">
      <div className="form-row">
        <label>thinking (linhas mostradas antes da resposta)</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.thinking)}
          placeholder={'ACESSANDO BANCO DE DADOS...'}
          onChange={(e) => update({ thinking: fromText(e.target.value) })}
        />
      </div>

      <div className="form-row">
        <label>fallback (quando nada casa)</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.fallback)}
          placeholder={'REGISTRO NÃO ENCONTRADO.'}
          onChange={(e) => update({ fallback: fromText(e.target.value) })}
        />
      </div>

      <div className="form-row">
        <label>empty (quando o jogador não digita assunto)</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.empty)}
          placeholder={'ESPECIFIQUE UM ASSUNTO.'}
          onChange={(e) => update({ empty: fromText(e.target.value) })}
        />
      </div>

      <div className="responses-head">
        <span>Respostas ({responses.length})</span>
        <button
          onClick={() => setResponses([...responses, { match: [], lines: [] }])}
        >
          + resposta
        </button>
      </div>

      {responses.map((r, i) => (
        <div className="response-card" key={i}>
          <div className="response-card__head">
            <span className="muted">#{i + 1}</span>
            <label className="muted" htmlFor={`rtype-${i}`}>estilo:</label>
            <select
              id={`rtype-${i}`}
              value={r.type && r.type !== 'normal' ? r.type : ''}
              style={{ width: 'auto' }}
              title="Cor/estilo da linha no terminal"
              onChange={(e) => patchResponse(i, { type: e.target.value || undefined })}
            >
              {RESPONSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="spacer" />
            <button onClick={() => setResponses(responses.filter((_, j) => j !== i))}>remover</button>
          </div>
          <label>match (palavras ou frases, separadas por vírgula)</label>
          <input
            type="text"
            value={(r.match ?? []).join(', ')}
            placeholder="nostromo, o que houve, autodestruição da nave"
            // Don't filter empties WHILE typing — that would eat a freshly typed
            // comma (and block a second keyword). Trim per segment so the join
            // reproduces the text; drop empty segments only on blur.
            onChange={(e) =>
              patchResponse(i, { match: e.target.value.split(',').map((s) => s.trim()) })
            }
            onBlur={() => patchResponse(i, { match: (r.match ?? []).filter(Boolean) })}
          />
          <div className="help">
            Casa quando a query do jogador <strong>contém</strong> o item (substring, ignora
            maiúsculas). Cada item pode ser palavra ou frase; a vírgula separa alternativas.
          </div>
          <label>lines (resposta, uma linha por row)</label>
          <textarea
            rows={3}
            spellCheck={false}
            value={(r.lines ?? []).join('\n')}
            onChange={(e) => patchResponse(i, { lines: e.target.value.split('\n') })}
          />
        </div>
      ))}

      {hasAny && (
        <button className="dialog-remove" onClick={removeDialog}>
          remover diálogo inteiro
        </button>
      )}
    </div>
  )
}
