import { useState, type CSSProperties } from 'react'
import { Toolbar } from './editor/Toolbar'
import { Desk } from './editor/Desk'
import { FileEditor } from './editor/FileEditor'
import { ValidationPanel } from './editor/ValidationPanel'
import { Dialogs } from './ui/Dialogs'
import { PreviewPanel } from './preview/PreviewPanel'
import { StagePreview } from './preview/StagePreview'
import { TemplatePicker } from './editor/TemplatePicker'
import { useT } from './i18n'

type View = 'file' | 'scenario'

const WIDTH_KEY = 'scenario-forge.desk.width'
const COLLAPSED_KEY = 'scenario-forge.desk.collapsed'
const MIN_WIDTH = 320
const DEFAULT_WIDTH = 460

function readWidth() {
  try {
    const value = Number(localStorage.getItem(WIDTH_KEY))
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_WIDTH
  } catch {
    return DEFAULT_WIDTH
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sem armazenamento: o menu volta ao padrão na próxima visita */
  }
}

function maxWidth() {
  return Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.6))
}

export function App() {
  const t = useT()
  const [view, setView] = useState<View>('scenario')
  const [preview, setPreview] = useState(false)
  const [templates, setTemplates] = useState(false)
  const [locked, setLocked] = useState(false)
  const [width, setWidth] = useState(() => Math.min(readWidth(), maxWidth()))
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

  function toggle(next: boolean) {
    setCollapsed(next)
    save(COLLAPSED_KEY, next ? '1' : '0')
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    const handle = e.currentTarget
    const left = handle.parentElement?.getBoundingClientRect().left ?? 0
    handle.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => setWidth(Math.min(maxWidth(), Math.max(MIN_WIDTH, ev.clientX - left)))
    const stop = (ev: PointerEvent) => {
      handle.releasePointerCapture(ev.pointerId)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      setWidth((w) => {
        save(WIDTH_KEY, String(w))
        return w
      })
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
  }

  function nudge(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 60 : 20
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = Math.min(maxWidth(), Math.max(MIN_WIDTH, width + (e.key === 'ArrowRight' ? step : -step)))
    setWidth(next)
    save(WIDTH_KEY, String(next))
  }

  return (
    <div className="app">
      <div className="top">
        <Toolbar
          locked={locked}
          onUnlock={() => setLocked(false)}
          onLock={() => setLocked(true)}
          onFresh={() => setLocked(false)}
          onExisting={() => setLocked(true)}
          onShowScenario={() => setView('scenario')}
          onPreview={() => setPreview(true)}
          onTemplates={() => setTemplates(true)}
        />
        {locked && (
          <div className="lock-bar">
            <span>
              {t(
                'Cenário travado — abre pelo botão Editar para não mexer sem querer.',
                'Scenario locked — press Edit so you don’t change it by accident.',
              )}
            </span>
            <button className="primary" type="button" onClick={() => setLocked(false)}>
              {t('Editar', 'Edit')}
            </button>
          </div>
        )}
      </div>
      <div
        className={collapsed ? 'main is-collapsed' : 'main'}
        style={{ '--desk-w': `${width}px` } as CSSProperties}
        {...(locked ? { inert: '' } : {})}
      >
        {collapsed ? null : (
          <Desk
            fileView={view === 'file'}
            locked={locked}
            onShowScenario={() => setView('scenario')}
            onSelectFile={() => setView('file')}
            onCollapse={() => toggle(true)}
          />
        )}
        {collapsed ? null : (
          <div
            className="desk-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label={t('Largura do menu', 'Menu width')}
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            tabIndex={0}
            onPointerDown={startResize}
            onKeyDown={nudge}
            onDoubleClick={() => {
              setWidth(DEFAULT_WIDTH)
              save(WIDTH_KEY, String(DEFAULT_WIDTH))
            }}
          />
        )}
        <section className="stage">
          {collapsed && (
            <button type="button" className="desk-expand" onClick={() => toggle(false)} title={t('Abrir o menu', 'Open the menu')}>
              ▸ {t('Menu', 'Menu')}
            </button>
          )}
          {view === 'scenario' ? <StagePreview onFullscreen={() => setPreview(true)} /> : <FileEditor />}
        </section>
      </div>
      <ValidationPanel />
      <Dialogs />
      {preview && <PreviewPanel onClose={() => setPreview(false)} />}
      {templates && (
        <TemplatePicker
          onClose={() => setTemplates(false)}
          onPicked={() => {
            setLocked(false)
            setView('scenario')
          }}
        />
      )}
    </div>
  )
}
