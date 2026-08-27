import { useState } from 'react'
import { Toolbar } from './editor/Toolbar'
import { FileTree } from './editor/FileTree'
import { FileEditor } from './editor/FileEditor'
import { FlagsPanel } from './editor/FlagsPanel'
import { ScenarioPanel } from './editor/ScenarioPanel'
import { ValidationPanel } from './editor/ValidationPanel'
import { Dialogs } from './ui/Dialogs'
import { PreviewPanel } from './preview/PreviewPanel'
import { TemplatePicker } from './editor/TemplatePicker'
import { useT } from './i18n'

type View = 'file' | 'scenario'

export function App() {
  const t = useT()
  const [view, setView] = useState<View>('scenario')
  const [preview, setPreview] = useState(false)
  const [templates, setTemplates] = useState(false)
  const [locked, setLocked] = useState(false)

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
      <div className="main" {...(locked ? { inert: '' } : {})}>
        <FileTree
          locked={locked}
          onShowScenario={() => setView('scenario')}
          onSelectFile={() => setView('file')}
        />
        {view === 'scenario' ? <ScenarioPanel /> : <FileEditor />}
        <FlagsPanel />
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
