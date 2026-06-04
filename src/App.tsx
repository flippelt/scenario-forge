import { useState } from 'react'
import { Toolbar } from './editor/Toolbar'
import { FileTree } from './editor/FileTree'
import { FileEditor } from './editor/FileEditor'
import { FlagsPanel } from './editor/FlagsPanel'
import { ScenarioPanel } from './editor/ScenarioPanel'
import { ValidationPanel } from './editor/ValidationPanel'
import { Dialogs } from './ui/Dialogs'
import { PreviewPanel } from './preview/PreviewPanel'

type View = 'file' | 'scenario'

export function App() {
  const [view, setView] = useState<View>('scenario')
  const [preview, setPreview] = useState(false)

  return (
    <div className="app">
      <Toolbar onShowScenario={() => setView('scenario')} onPreview={() => setPreview(true)} />
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
    </div>
  )
}
