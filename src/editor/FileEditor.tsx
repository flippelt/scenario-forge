import { useState } from 'react'
import { renderMarkdown } from 'rpgterm-engine'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { fileExt } from '../model/vfs'

export function FileEditor() {
  const t = useT()
  const selectedPath = useStore((s) => s.selectedPath)
  const lang = useStore((s) => s.lang)
  const file = useStore((s) => s.project.files.find((f) => f.path === s.selectedPath))
  const translatedBody = useStore((s) =>
    s.selectedPath && s.lang !== 'base'
      ? s.project.translations[s.lang]?.[s.selectedPath] ?? ''
      : ''
  )
  const setContent = useStore((s) => s.setContent)
  const [preview, setPreview] = useState(false)

  if (!selectedPath || !file) {
    return (
      <div className="col">
        <div className="empty">
          {t('Selecione um arquivo na árvore, ou abra o ', 'Select a file in the tree, or open ')}
          <code>scenario.json</code>.
        </div>
      </div>
    )
  }

  const editingBase = lang === 'base'
  const value = editingBase ? file.content : translatedBody
  const ext = fileExt(selectedPath)
  const isMd = ext === 'md'
  const showPreview = isMd && preview

  return (
    <div className="col">
      <div className="editor">
        <div className="path">
          <span>{selectedPath}{!editingBase && `  ·  [${lang}]`}</span>
          {isMd && (
            <button className="md-toggle" onClick={() => setPreview((p) => !p)}>
              {preview ? t('✎ Editar', '✎ Edit') : t('👁 Pré-visualizar', '👁 Preview')}
            </button>
          )}
        </div>
        {!editingBase ? (
          <div className="banner">
            {t('Editando a tradução ', 'Editing the ')}
            <strong>{lang}</strong>
            {t(' — apenas o corpo do texto. Os flags (lock/crack/tracer) ficam no arquivo base.',
              ' translation — body text only. Flags (lock/crack/tracer) stay on the base file.')}
          </div>
        ) : isMd ? (
          <div className="banner">
            {t('Arquivo ', 'File ')}<strong>.md</strong>
            {t(' — renderizado como markdown no terminal.', ' — rendered as markdown in the terminal.')}
          </div>
        ) : (
          <div className="banner">
            {t('Arquivo de dados — o painel à direita controla os flags do frontmatter.',
              'Data file — the panel on the right controls the front-matter flags.')}
          </div>
        )}
        {showPreview ? (
          <div className="md-preview" aria-label={t('pré-visualização do markdown', 'markdown preview')}>
            {renderMarkdown(value).map((l, i) => (
              <div key={i} className={`md-line ${l.type ?? ''}`}>{l.text || ' '}</div>
            ))}
          </div>
        ) : (
          <textarea
            value={value}
            spellCheck={false}
            placeholder={editingBase ? t('Conteúdo do arquivo…', 'File content…') : t(`Tradução (${lang})…`, `Translation (${lang})…`)}
            onChange={(e) => setContent(selectedPath, e.target.value)}
          />
        )}
      </div>
    </div>
  )
}
