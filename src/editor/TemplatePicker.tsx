import { useEffect } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { TEMPLATES } from '../model/templates'

// A small overlay listing starter scenarios. Picking one replaces the current
// project (the caller already confirmed discarding unsaved work).
export function TemplatePicker({ onClose, onPicked }: { onClose: () => void; onPicked: () => void }) {
  const t = useT()
  const loadProject = useStore((s) => s.loadProject)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dialog" style={{ width: 'min(580px, 92vw)' }}>
        <h3>{t('Novo cenário a partir de um template', 'New scenario from a template')}</h3>
        <div className="template-list">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              className="template-item"
              onClick={() => {
                loadProject(tpl.build())
                onPicked()
                onClose()
              }}
            >
              <span className="template-label">{t(tpl.label.pt, tpl.label.en)}</span>
              <span className="template-desc">{t(tpl.description.pt, tpl.description.en)}</span>
            </button>
          ))}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>{t('Cancelar', 'Cancel')}</button>
        </div>
      </div>
    </div>
  )
}
