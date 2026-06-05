import { useEffect } from 'react'
import { useStore } from '../model/store'
import { TEMPLATES } from '../model/templates'

// A small overlay listing starter scenarios. Picking one replaces the current
// project (the caller already confirmed discarding unsaved work).
export function TemplatePicker({ onClose, onPicked }: { onClose: () => void; onPicked: () => void }) {
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
        <h3>Novo cenário a partir de um template</h3>
        <div className="template-list">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="template-item"
              onClick={() => {
                loadProject(t.build())
                onPicked()
                onClose()
              }}
            >
              <span className="template-label">{t.label}</span>
              <span className="template-desc">{t.description}</span>
            </button>
          ))}
        </div>
        <div className="dialog-actions">
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
