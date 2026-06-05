import { useState } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { buildTree, type TreeNode } from '../model/vfs'
import type { FileNode } from '../model/types'
import { promptText, confirmDialog } from '../ui/dialog'

function Row({
  node,
  metaByPath,
  onSelectFile,
  onMove
}: {
  node: TreeNode
  metaByPath: Map<string, FileNode>
  onSelectFile: () => void
  onMove: (fromPath: string, toDir: string) => void
}) {
  const t = useT()
  const selectedPath = useStore((s) => s.selectedPath)
  const select = useStore((s) => s.select)
  const [over, setOver] = useState(false)

  if (node.type === 'dir') {
    return (
      <li className="dir">
        <div
          className={`row ${over ? 'drop-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOver(false)
            onMove(e.dataTransfer.getData('text/plain'), node.path)
          }}
        >
          📁 {node.name}
        </div>
        {node.children.length > 0 && (
          <ul>
            {node.children.map((c) => (
              <Row key={c.path} node={c} metaByPath={metaByPath} onSelectFile={onSelectFile} onMove={onMove} />
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
        draggable
        title={t('Arraste para mover de pasta', 'Drag to move to another folder')}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', node.path)
          e.dataTransfer.effectAllowed = 'move'
        }}
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
  const t = useT()
  const files = useStore((s) => s.project.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const renameFile = useStore((s) => s.renameFile)
  const selectedPath = useStore((s) => s.selectedPath)
  const scenarioId = useStore((s) => s.project.meta.id)

  const tree = buildTree(files)
  const metaByPath = new Map(files.map((f) => [f.path, f]))

  const exists = (path: string) => files.some((f) => f.path === path)
  const dup = () => t('Já existe um arquivo nesse caminho.', 'A file already exists at that path.')
  const empty = () => t('Informe um caminho.', 'Enter a path.')

  const move = (fromPath: string, toDir: string) => {
    if (!fromPath) return
    const name = fromPath.split('/').pop()
    if (!name) return
    const newPath = (toDir === '/' ? '' : toDir) + '/' + name
    if (newPath === fromPath || exists(newPath)) return
    renameFile(fromPath, newPath)
  }

  const promptNew = async (locked: boolean) => {
    const p = await promptText({
      title: locked ? t('Novo arquivo bloqueado', 'New locked file') : t('Novo arquivo', 'New file'),
      message: locked
        ? t('Caminho do novo arquivo .dat (ex.: /intel/safe.dat)', 'Path of the new .dat file (e.g. /intel/safe.dat)')
        : t('Caminho do novo arquivo (ex.: /case.md)', 'Path of the new file (e.g. /case.md)'),
      placeholder: locked ? '/intel/safe.dat' : '/case.md',
      validate: (v) => {
        const tx = v.trim()
        if (!tx) return empty()
        const norm = tx.startsWith('/') ? tx : '/' + tx
        if (exists(norm)) return dup()
        return null
      }
    })
    if (p && p.trim()) addFile(p.trim(), locked)
  }

  return (
    <div className="col tree">
      <p className="col-title">{t('Cenário', 'Scenario')} · {scenarioId}</p>
      <button className="scenario-item" onClick={onShowScenario}>
        ⚙ scenario.json
      </button>

      <div className="tree-actions">
        <button onClick={() => promptNew(false)}>{t('+ arquivo', '+ file')}</button>
        <button onClick={() => promptNew(true)}>+ 🔒 .dat</button>
      </div>
      {selectedPath && (
        <div className="tree-actions">
          <button
            onClick={async () => {
              const np = await promptText({
                title: t('Renomear arquivo', 'Rename file'),
                message: t('Novo caminho', 'New path'),
                defaultValue: selectedPath,
                validate: (v) => {
                  const tx = v.trim()
                  if (!tx) return empty()
                  const norm = tx.startsWith('/') ? tx : '/' + tx
                  if (norm !== selectedPath && exists(norm)) return dup()
                  return null
                }
              })
              if (np && np.trim()) renameFile(selectedPath, np.trim())
            }}
          >
            {t('renomear', 'rename')}
          </button>
          <button
            onClick={async () => {
              if (await confirmDialog({ title: t('Excluir arquivo', 'Delete file'), message: t(`Excluir ${selectedPath}?`, `Delete ${selectedPath}?`), okLabel: t('Excluir', 'Delete'), cancelLabel: t('Cancelar', 'Cancel') }))
                deleteFile(selectedPath)
            }}
          >
            {t('excluir', 'delete')}
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="muted">{t('Nenhum arquivo. Crie o primeiro acima.', 'No files yet. Create the first one above.')}</p>
      ) : (
        <ul
          className="tree"
          title={t('Arraste um arquivo para uma pasta (ou para o vazio = raiz)', 'Drag a file onto a folder (or empty space = root)')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            move(e.dataTransfer.getData('text/plain'), '/')
          }}
        >
          {tree.children.map((c) => (
            <Row key={c.path} node={c} metaByPath={metaByPath} onSelectFile={onSelectFile} onMove={move} />
          ))}
        </ul>
      )}
    </div>
  )
}
