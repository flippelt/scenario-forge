import { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { buildTree, type TreeNode } from '../model/vfs'
import { FileTree } from './FileTree'
import { FlagsPanel } from './FlagsPanel'
import { ScenarioPanel } from './ScenarioPanel'

const GERAL = '⚙'

/** File paths in the order the tree shows them, for the ← / → steps. */
function filesInTreeOrder(node: TreeNode, out: string[] = []): string[] {
  for (const c of node.children) {
    if (c.type === 'file') out.push(c.path)
    else filesInTreeOrder(c, out)
  }
  return out
}

// The side menu, in the opord layout: what to edit at the top, then only the
// blocks of that item, then ← / → to walk from Geral through every file.
export function Desk({
  fileView,
  locked,
  onShowScenario,
  onSelectFile,
  onCollapse
}: {
  fileView: boolean
  locked: boolean
  onShowScenario: () => void
  onSelectFile: () => void
  onCollapse: () => void
}) {
  const t = useT()
  const files = useStore((s) => s.project.files)
  const selectedPath = useStore((s) => s.selectedPath)
  const select = useStore((s) => s.select)
  const scenarioId = useStore((s) => s.project.meta.id)
  const desk = useRef<HTMLElement>(null)

  const steps = useMemo(() => [GERAL, ...filesInTreeOrder(buildTree(files))], [files])
  const current = fileView && selectedPath ? selectedPath : GERAL
  const at = Math.max(0, steps.indexOf(current))
  const prev = at > 0 ? steps[at - 1] : null
  const next = at < steps.length - 1 ? steps[at + 1] : null

  useEffect(() => {
    desk.current?.scrollTo?.({ top: 0 })
  }, [current])

  const labelOf = (key: string) => (key === GERAL ? t('Geral', 'General') : key.split('/').pop() ?? key)
  const go = (key: string) => {
    if (key === GERAL) onShowScenario()
    else {
      select(key)
      onSelectFile()
    }
  }

  return (
    <aside ref={desk} className="desk">
      <header className="desk-brand">
        <div>
          <p className="desk-kicker">{t('Cenário', 'Scenario')}</p>
          <h1>{scenarioId || '…'}</h1>
        </div>
        <button type="button" className="desk-collapse" onClick={onCollapse} title={t('Recolher o menu', 'Collapse the menu')}>
          ◂ {t('Recolher', 'Collapse')}
        </button>
      </header>

      <FileTree locked={locked} fileView={fileView} onShowScenario={onShowScenario} onSelectFile={onSelectFile} />

      <div className="desk-step">
        <p className="desk-kicker">
          {t('Passo', 'Step')} {at + 1} {t('de', 'of')} {steps.length}
        </p>
        <h2>{current === GERAL ? t('Geral', 'General') : current}</h2>
        <p className="field-hint">
          {current === GERAL
            ? t('O que vale para o cenário inteiro. A tela ao lado mostra o terminal.', 'What applies to the whole scenario. The screen beside shows the terminal.')
            : t('Só os flags deste arquivo. O texto fica ao lado.', 'Only this file’s flags. The text is beside.')}
        </p>
      </div>

      <div className="desk-panel" key={current}>
        {current === GERAL ? <ScenarioPanel /> : <FlagsPanel />}
      </div>

      <nav className="desk-nav" aria-label={t('Passos', 'Steps')}>
        <button type="button" disabled={!prev} onClick={() => prev && go(prev)}>
          ← {prev ? labelOf(prev) : t('Início', 'Start')}
        </button>
        <button type="button" className="primary" disabled={!next} onClick={() => next && go(next)}>
          {next ? labelOf(next) : t('Fim', 'End')} →
        </button>
      </nav>
    </aside>
  )
}
