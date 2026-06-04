import { useStore } from '../model/store'
import { fileExt } from '../model/vfs'

export function FileEditor() {
  const selectedPath = useStore((s) => s.selectedPath)
  const lang = useStore((s) => s.lang)
  const file = useStore((s) =>
    s.project.files.find((f) => f.path === s.selectedPath)
  )
  const translatedBody = useStore((s) =>
    s.selectedPath && s.lang !== 'base'
      ? s.project.translations[s.lang]?.[s.selectedPath] ?? ''
      : ''
  )
  const setContent = useStore((s) => s.setContent)

  if (!selectedPath || !file) {
    return (
      <div className="col">
        <div className="empty">
          Selecione um arquivo na árvore, ou abra o <code>scenario.json</code>.
        </div>
      </div>
    )
  }

  const editingBase = lang === 'base'
  const value = editingBase ? file.content : translatedBody
  const ext = fileExt(selectedPath)

  return (
    <div className="col">
      <div className="editor">
        <div className="path">{selectedPath}{!editingBase && `  ·  [${lang}]`}</div>
        {!editingBase ? (
          <div className="banner">
            Editando a tradução <strong>{lang}</strong> — apenas o corpo do texto.
            Os flags (lock/crack/tracer) ficam no arquivo base.
          </div>
        ) : ext === 'md' ? (
          <div className="banner">Arquivo <strong>.md</strong> — renderizado como markdown no terminal.</div>
        ) : (
          <div className="banner">
            Arquivo de dados — o painel à direita controla os flags do frontmatter.
          </div>
        )}
        <textarea
          value={value}
          spellCheck={false}
          placeholder={editingBase ? 'Conteúdo do arquivo…' : `Tradução (${lang})…`}
          onChange={(e) => setContent(selectedPath, e.target.value)}
        />
      </div>
    </div>
  )
}
