import { useStore } from '../model/store'
import { useT } from '../i18n'
import type { Dialog, DialogResponse, ScenarioMeta } from '../model/types'

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

// `match` é editado como texto separado por `;`. Enquanto o usuário digita,
// dividimos SEM trim — senão o espaço final é cortado a cada tecla e palavras
// de uma frase colam ("self destruct" vira "selfdestruct"). A normalização
// (trim + remover vazios) acontece só no blur.
export const splitMatchInput = (raw: string): string[] => raw.split(';')
export const normalizeMatch = (arr: string[]): string[] =>
  arr.map((s) => s.trim()).filter(Boolean)

export function DialogEditor() {
  const t = useT()
  const dialog = (useStore((s) => s.project.meta.dialog) ?? EMPTY_DIALOG) as Dialog
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

  // `type` = cor/estilo da linha no terminal. '' e 'normal' são equivalentes.
  const RESPONSE_TYPES = [
    { value: '', label: t('normal — cor padrão', 'normal — default color') },
    { value: 'muted', label: t('muted — apagado (secundário)', 'muted — dim (secondary)') },
    { value: 'ok', label: t('ok — verde (sucesso)', 'ok — green (success)') },
    { value: 'err', label: t('err — vermelho (erro)', 'err — red (error)') }
  ]

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
        <label>{t('thinking (linhas antes da resposta)', 'thinking (lines shown before the answer)')}</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.thinking)}
          placeholder={t('ACESSANDO BANCO DE DADOS...', 'ACCESSING DATABASE...')}
          onChange={(e) => update({ thinking: fromText(e.target.value) })}
        />
      </div>

      <div className="form-row">
        <label>{t('fallback (quando nada casa)', 'fallback (when nothing matches)')}</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.fallback)}
          placeholder={t('REGISTRO NÃO ENCONTRADO.', 'RECORD NOT FOUND.')}
          onChange={(e) => update({ fallback: fromText(e.target.value) })}
        />
      </div>

      <div className="form-row">
        <label>{t('empty (quando não digita assunto)', 'empty (when no subject is typed)')}</label>
        <textarea
          rows={2}
          spellCheck={false}
          value={toText(dialog.empty)}
          placeholder={t('ESPECIFIQUE UM ASSUNTO.', 'SPECIFY A SUBJECT.')}
          onChange={(e) => update({ empty: fromText(e.target.value) })}
        />
      </div>

      <div className="responses-head">
        <span>{t('Respostas', 'Responses')} ({responses.length})</span>
        <button onClick={() => setResponses([...responses, { match: [], lines: [] }])}>
          {t('+ resposta', '+ response')}
        </button>
      </div>

      {responses.map((r, i) => (
        <div className="response-card" key={i}>
          <div className="response-card__head">
            <span className="muted">#{i + 1}</span>
            <label className="muted" htmlFor={`rtype-${i}`}>{t('estilo:', 'style:')}</label>
            <select
              id={`rtype-${i}`}
              value={r.type && r.type !== 'normal' ? r.type : ''}
              style={{ width: 'auto' }}
              title={t('Cor/estilo da linha no terminal', 'Line color/style in the terminal')}
              onChange={(e) => patchResponse(i, { type: e.target.value || undefined })}
            >
              {RESPONSE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <span className="spacer" />
            <button onClick={() => setResponses(responses.filter((_, j) => j !== i))}>{t('remover', 'remove')}</button>
          </div>
          <label>{t('match (palavras ou frases, separadas por ;)', 'match (words or phrases, separated by ;)')}</label>
          <input
            type="text"
            value={(r.match ?? []).join('; ')}
            placeholder={t('nostromo; o que houve, exatamente?; autodestruição', 'nostromo; what happened, exactly?; self-destruct')}
            onChange={(e) => patchResponse(i, { match: splitMatchInput(e.target.value) })}
            onBlur={() => patchResponse(i, { match: normalizeMatch(r.match ?? []) })}
          />
          <div className="help">
            {t('Casa quando a query do jogador ', 'Matches when the player query ')}
            <strong>{t('contém', 'contains')}</strong>
            {t(' o item (substring, ignora maiúsculas). Cada item pode ser palavra ou frase; o ',
              ' the item (substring, case-insensitive). Each item can be a word or a phrase; ')}
            <strong>;</strong>
            {t(' separa alternativas — assim a frase pode ter vírgula.', ' separates alternatives — so a phrase can contain a comma.')}
          </div>
          <label>{t('lines (resposta, uma linha por row)', 'lines (the answer, one line per row)')}</label>
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
          {t('remover diálogo inteiro', 'remove entire dialog')}
        </button>
      )}
    </div>
  )
}
