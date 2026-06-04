import { useStore } from '../model/store'
import { promptText } from '../ui/dialog'
import type { Line, ScenarioMeta } from '../model/types'

// Friendly editor for `events` — lines that play right after a file is
// unlocked (an alarm, a villain's taunt, a countdown). Each event is keyed by
// the file path. Lines keep their ORDER; text lines are editable, a `countdown`
// gets dedicated fields, and any other special object is preserved read-only.

type Events = Record<string, Line[]>
const EMPTY_EVENTS: Events = {}

const LINE_TYPES = [
  { value: '', label: 'normal' },
  { value: 'muted', label: 'muted' },
  { value: 'ok', label: 'ok (verde)' },
  { value: 'err', label: 'err (vermelho)' }
]

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
  const events = (useStore((s) => s.project.meta.events) ?? EMPTY_EVENTS) as Events
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const replaceMeta = useStore((s) => s.replaceMeta)

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
      title: 'Novo evento',
      message: 'Caminho do arquivo cujo desbloqueio dispara o evento',
      placeholder: '/blackbox.dat',
      validate: (v) => {
        const t = v.trim()
        if (!t) return 'Informe um caminho.'
        const norm = t.startsWith('/') ? t : '/' + t
        if (events[norm]) return 'Já existe um evento para esse caminho.'
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
        <p className="help">Nenhum evento. Use “+ evento” para disparar linhas ao desbloquear um arquivo.</p>
      )}

      {paths.map((path) => (
        <div className="event-card" key={path}>
          <div className="event-card__head">
            <span className="muted">ao abrir</span>
            <code className="event-path">{path}</code>
            <span className="spacer" />
            <button onClick={() => removePath(path)}>remover evento</button>
          </div>

          {events[path].map((line, i) => {
            const kind = kindOf(line)
            const cd = (typeof line === 'object' ? line : {}) as Record<string, unknown>
            return (
              <div className="event-line" key={i}>
                <div className="event-line__ctrls">
                  <button onClick={() => moveLine(path, i, -1)} disabled={i === 0} title="subir">↑</button>
                  <button onClick={() => moveLine(path, i, 1)} disabled={i === events[path].length - 1} title="descer">↓</button>
                  <button onClick={() => removeLine(path, i)} title="remover linha">✕</button>
                </div>

                {kind === 'text' && (
                  <div className="event-line__body">
                    <input
                      type="text"
                      value={textOf(line)}
                      placeholder="texto da linha"
                      onChange={(e) => {
                        const t = typeOf(line)
                        updateLine(path, i, t ? { text: e.target.value, type: t } : { text: e.target.value })
                      }}
                    />
                    <select
                      value={typeOf(line)}
                      style={{ width: 'auto' }}
                      title="cor/estilo"
                      onChange={(e) => {
                        const v = e.target.value
                        updateLine(path, i, v ? { text: textOf(line), type: v } : { text: textOf(line) })
                      }}
                    >
                      {LINE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
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
                    <span className="badge">linha especial — edite no JSON avançado</span>
                    <code className="raw-line">{JSON.stringify(line)}</code>
                  </div>
                )}
              </div>
            )
          })}

          <div className="event-add">
            <button onClick={() => setLines(path, [...events[path], { text: '' }])}>+ linha</button>
            <button onClick={() => setLines(path, [...events[path], { type: 'countdown', from: 5, interval: 700, label: 'TRACE COMPLETE IN', alarm: true }])}>
              + countdown
            </button>
          </div>
        </div>
      ))}

      <button className="event-add-path" onClick={addPath}>+ evento</button>
    </div>
  )
}
