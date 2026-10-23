import { useState, type CSSProperties } from 'react'
import { useResizableWidth } from 'rpg-prop-kit'
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

export function App() {
  const t = useT()
  const [view, setView] = useState<View>('scenario')
  const [preview, setPreview] = useState(false)
  const [templates, setTemplates] = useState(false)
  const [locked, setLocked] = useState(false)
  const { width, collapsed, setCollapsed, handleProps } = useResizableWidth({
    storageKey: 'scenario-forge.desk',
    label: t('Largura do menu', 'Menu width'),
  })

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
            onCollapse={() => setCollapsed(true)}
          />
        )}
        {collapsed ? null : (
          <div className="desk-resizer" {...handleProps} />
        )}
        <section className="stage">
          {collapsed && (
            <button type="button" className="desk-expand" onClick={() => setCollapsed(false)} title={t('Abrir o menu', 'Open the menu')}>
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
