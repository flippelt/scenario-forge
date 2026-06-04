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

type View = 'file' | 'scenario'

export function App() {
  const [view, setView] = useState<View>('scenario')
  const [preview, setPreview] = useState(false)
  const [templates, setTemplates] = useState(false)

  return (
    <div className="app">
      <Toolbar
        onShowScenario={() => setView('scenario')}
        onPreview={() => setPreview(true)}
        onTemplates={() => setTemplates(true)}
      />
      <div className="main">
        <FileTree
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
        <TemplatePicker onClose={() => setTemplates(false)} onPicked={() => setView('scenario')} />
      )}
    </div>
  )
}
