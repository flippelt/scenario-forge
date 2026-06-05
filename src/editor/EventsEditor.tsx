import { useStore } from '../model/store'
import { useT } from '../i18n'
import { promptText } from '../ui/dialog'
import type { Line, ScenarioMeta } from '../model/types'

// Friendly editor for `events` — lines that play right after a file is
// unlocked. Lines keep their ORDER; text lines are editable, a `countdown` gets
// dedicated fields, and any other special object is preserved read-only.

type Events = Record<string, Line[]>
const EMPTY_EVENTS: Events = {}

type Kind = 'text' | 'countdown' | 'raw'
function kindOf(l: Line): Kind {
  if (typeof l === 'string') return 'text'
  if (l && typeof l === 'object') {
    if (l.type === 'countdown') return 'countdown'
    if ('text' in l) return 'text'
  }
  return 'raw'
}
const textOf = (l: Line) => (typeof l === 'string' ? l : (l.text ?? ''))
const typeOf = (l: Line) => (typeof l === 'string' ? '' : (l.type ?? ''))

export function EventsEditor() {
  const t = useT()
  const events = (useStore((s) => s.project.meta.events) ?? EMPTY_EVENTS) as Events
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

  const LINE_TYPES = [
    { value: '', label: 'normal' },
    { value: 'muted', label: t('muted (apagado)', 'muted (dim)') },
    { value: 'ok', label: t('ok (verde)', 'ok (green)') },
    { value: 'err', label: t('err (vermelho)', 'err (red)') }
  ]

  const paths = Object.keys(events)

  const commit = (next: Events) => {
    if (Object.keys(next).length === 0) {
      const m = { ...meta } as ScenarioMeta
      delete m.events
      replaceMeta(m)
    } else {
      setMeta({ events: next })
    }
  }

  const setLines = (path: string, lines: Line[]) => commit({ ...events, [path]: lines })

  const addPath = async () => {
    const p = await promptText({
      title: t('Novo evento', 'New event'),
      message: t('Caminho do arquivo cujo desbloqueio dispara o evento', 'Path of the file whose unlock triggers the event'),
      placeholder: '/blackbox.dat',
      validate: (v) => {
        const tx = v.trim()
        if (!tx) return t('Informe um caminho.', 'Enter a path.')
        const norm = tx.startsWith('/') ? tx : '/' + tx
        if (events[norm]) return t('Já existe um evento para esse caminho.', 'There is already an event for that path.')
        return null
      }
    })
    if (p) {
      const norm = p.trim().startsWith('/') ? p.trim() : '/' + p.trim()
      commit({ ...events, [norm]: [{ text: '' }] })
    }
  }

  const removePath = (path: string) => {
    const { [path]: _drop, ...rest } = events
    commit(rest)
  }

  const moveLine = (path: string, i: number, dir: -1 | 1) => {
    const lines = [...events[path]]
    const j = i + dir
    if (j < 0 || j >= lines.length) return
    ;[lines[i], lines[j]] = [lines[j], lines[i]]
    setLines(path, lines)
  }
  const removeLine = (path: string, i: number) =>
    setLines(path, events[path].filter((_, j) => j !== i))
  const updateLine = (path: string, i: number, line: Line) =>
    setLines(path, events[path].map((l, j) => (j === i ? line : l)))

  return (
    <div className="events-editor">
      {paths.length === 0 && (
        <p className="help">{t('Nenhum evento. Use “+ evento” para disparar linhas ao desbloquear um arquivo.', 'No events. Use “+ event” to play lines when a file is unlocked.')}</p>
      )}

      {paths.map((path) => (
        <div className="event-card" key={path}>
          <div className="event-card__head">
            <span className="muted">{t('ao abrir', 'on open')}</span>
            <code className="event-path">{path}</code>
            <span className="spacer" />
            <button onClick={() => removePath(path)}>{t('remover evento', 'remove event')}</button>
          </div>

          {events[path].map((line, i) => {
            const kind = kindOf(line)
            const cd = (typeof line === 'object' ? line : {}) as Record<string, unknown>
            return (
              <div className="event-line" key={i}>
                <div className="event-line__ctrls">
                  <button onClick={() => moveLine(path, i, -1)} disabled={i === 0} title={t('subir', 'move up')}>↑</button>
                  <button onClick={() => moveLine(path, i, 1)} disabled={i === events[path].length - 1} title={t('descer', 'move down')}>↓</button>
                  <button onClick={() => removeLine(path, i)} title={t('remover linha', 'remove line')}>✕</button>
                </div>

                {kind === 'text' && (
                  <div className="event-line__body">
                    <input
                      type="text"
                      value={textOf(line)}
                      placeholder={t('texto da linha', 'line text')}
                      onChange={(e) => {
                        const ty = typeOf(line)
                        updateLine(path, i, ty ? { text: e.target.value, type: ty } : { text: e.target.value })
                      }}
                    />
                    <select
                      value={typeOf(line)}
                      style={{ width: 'auto' }}
                      title={t('cor/estilo', 'color/style')}
                      onChange={(e) => {
                        const v = e.target.value
                        updateLine(path, i, v ? { text: textOf(line), type: v } : { text: textOf(line) })
                      }}
                    >
                      {LINE_TYPES.map((lt) => (
                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {kind === 'countdown' && (
                  <div className="event-line__body countdown">
                    <span className="badge">⏱ countdown</span>
                    <label>label</label>
                    <input
                      type="text"
                      value={String(cd.label ?? '')}
                      onChange={(e) => updateLine(path, i, { ...cd, type: 'countdown', label: e.target.value })}
                    />
                    <label>from</label>
                    <input
                      type="number"
                      value={cd.from == null ? '' : String(cd.from)}
                      onChange={(e) => updateLine(path, i, { ...cd, type: 'countdown', from: Number(e.target.value) })}
                    />
                    <label>interval (ms)</label>
                    <input
                      type="number"
                      value={cd.interval == null ? '' : String(cd.interval)}
                      onChange={(e) => updateLine(path, i, { ...cd, type: 'countdown', interval: Number(e.target.value) })}
                    />
                    <label className="cb">
                      <input
                        type="checkbox"
                        checked={cd.alarm === true}
                        onChange={(e) => updateLine(path, i, { ...cd, type: 'countdown', alarm: e.target.checked })}
                      />
                      alarm
                    </label>
                  </div>
                )}

                {kind === 'raw' && (
                  <div className="event-line__body">
                    <span className="badge">{t('linha especial — edite no JSON avançado', 'special line — edit in advanced JSON')}</span>
                    <code className="raw-line">{JSON.stringify(line)}</code>
                  </div>
                )}
              </div>
            )
          })}

          <div className="event-add">
            <button onClick={() => setLines(path, [...events[path], { text: '' }])}>{t('+ linha', '+ line')}</button>
            <button onClick={() => setLines(path, [...events[path], { type: 'countdown', from: 5, interval: 700, label: 'TRACE COMPLETE IN', alarm: true }])}>
              + countdown
            </button>
          </div>
        </div>
      ))}

      <button className="event-add-path" onClick={addPath}>{t('+ evento', '+ event')}</button>
    </div>
  )
}
