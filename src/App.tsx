import { useState } from 'react'
import { Toolbar } from './editor/Toolbar'
import { FileTree } from './editor/FileTree'
import { FileEditor } from './editor/FileEditor'
import { FlagsPanel } from './editor/FlagsPanel'
import { ScenarioPanel } from './editor/ScenarioPanel'
import { ValidationPanel } from './editor/ValidationPanel'
import { Dialogs } from './ui/Dialogs'

type View = 'file' | 'scenario'

export function App() {
  const [view, setView] = useState<View>('scenario')

  return (
    <div className="app">
      <Toolbar onShowScenario={() => setView('scenario')} />
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
    </div>
  )
}
