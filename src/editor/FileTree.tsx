import { useStore } from '../model/store'
import { buildTree, type TreeNode } from '../model/vfs'
import type { FileNode } from '../model/types'
import { promptText, confirmDialog } from '../ui/dialog'

function Row({
  node,
  metaByPath,
  onSelectFile
}: {
  node: TreeNode
  metaByPath: Map<string, FileNode>
  onSelectFile: () => void
}) {
  const selectedPath = useStore((s) => s.selectedPath)
  const select = useStore((s) => s.select)

  if (node.type === 'dir') {
    return (
      <li className="dir">
        <div className="row">📁 {node.name}</div>
        {node.children.length > 0 && (
          <ul>
            {node.children.map((c) => (
              <Row key={c.path} node={c} metaByPath={metaByPath} onSelectFile={onSelectFile} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  const file = metaByPath.get(node.path)
  const locked = file?.meta.locked === true
  return (
    <li>
      <div
        className={`row ${selectedPath === node.path ? 'active' : ''}`}
        onClick={() => {
          select(node.path)
          onSelectFile()
        }}
      >
        📄 {node.name}
        {locked && <span className="lock">🔒</span>}
      </div>
    </li>
  )
}

export function FileTree({
  onShowScenario,
  onSelectFile
}: {
  onShowScenario: () => void
  onSelectFile: () => void
}) {
  const files = useStore((s) => s.project.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const renameFile = useStore((s) => s.renameFile)
  const selectedPath = useStore((s) => s.selectedPath)
  const scenarioId = useStore((s) => s.project.meta.id)

  const tree = buildTree(files)
  const metaByPath = new Map(files.map((f) => [f.path, f]))

  const exists = (path: string) => files.some((f) => f.path === path)

  const promptNew = async (locked: boolean) => {
    const p = await promptText({
      title: locked ? 'Novo arquivo bloqueado' : 'Novo arquivo',
      message: locked
        ? 'Caminho do novo arquivo .dat (ex.: /intel/safe.dat)'
        : 'Caminho do novo arquivo (ex.: /case.md)',
      placeholder: locked ? '/intel/safe.dat' : '/case.md',
      validate: (v) => {
        const t = v.trim()
        if (!t) return 'Informe um caminho.'
        const norm = t.startsWith('/') ? t : '/' + t
        if (exists(norm)) return 'Já existe um arquivo nesse caminho.'
        return null
      }
    })
    if (p && p.trim()) addFile(p.trim(), locked)
  }

  return (
    <div className="col tree">
      <p className="col-title">Cenário · {scenarioId}</p>
      <button
        className={`scenario-item ${selectedPath === null ? '' : ''}`}
        onClick={onShowScenario}
      >
        ⚙ scenario.json
      </button>

      <div className="tree-actions">
        <button onClick={() => promptNew(false)}>+ arquivo</button>
        <button onClick={() => promptNew(true)}>+ 🔒 .dat</button>
      </div>
      {selectedPath && (
        <div className="tree-actions">
          <button
            onClick={async () => {
              const np = await promptText({
                title: 'Renomear arquivo',
                message: 'Novo caminho',
                defaultValue: selectedPath,
                validate: (v) => {
                  const t = v.trim()
                  if (!t) return 'Informe um caminho.'
                  const norm = t.startsWith('/') ? t : '/' + t
                  if (norm !== selectedPath && exists(norm)) return 'Já existe um arquivo nesse caminho.'
                  return null
                }
              })
              if (np && np.trim()) renameFile(selectedPath, np.trim())
            }}
          >
            renomear
          </button>
          <button
            onClick={async () => {
              if (await confirmDialog({ title: 'Excluir arquivo', message: `Excluir ${selectedPath}?`, okLabel: 'Excluir' }))
                deleteFile(selectedPath)
            }}
          >
            excluir
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="muted">Nenhum arquivo. Crie o primeiro acima.</p>
      ) : (
        <ul className="tree">
          {tree.children.map((c) => (
            <Row key={c.path} node={c} metaByPath={metaByPath} onSelectFile={onSelectFile} />
          ))}
        </ul>
      )}
    </div>
  )
}
