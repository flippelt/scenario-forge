import { useEffect, useRef, useState } from 'react'
import { useDialog } from './dialog'
import { useT } from '../i18n'

// Renders the single active dialog. Enter submits, Esc cancels; the prompt
// input autofocuses and runs the optional validator before resolving.
export function Dialogs() {
  const t = useT()
  const current = useDialog((s) => s.current)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (current?.kind === 'prompt') {
      setValue(current.defaultValue ?? '')
      setError(null)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [current])

  if (!current) return null

  const cancel = () => current.resolve(current.kind === 'confirm' ? false : null)
  const submit = () => {
    if (current.kind === 'prompt') {
      const err = current.validate?.(value) ?? null
      if (err) {
        setError(err)
        return
      }
      current.resolve(value)
    } else {
      current.resolve(true)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel()
      }}
    >
      <div className="dialog" onKeyDown={onKey}>
        <h3>{current.title}</h3>
        {current.message && <p className="dialog-msg">{current.message}</p>}
        {current.kind === 'prompt' && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={value}
              placeholder={current.placeholder}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError(null)
              }}
            />
            {error && <div className="json-error">⚠ {error}</div>}
          </>
        )}
        <div className="dialog-actions">
          {current.kind !== 'alert' && (
            <button onClick={cancel}>{current.cancelLabel ?? t('Cancelar', 'Cancel')}</button>
          )}
          <button className="primary" onClick={submit}>
            {current.okLabel ?? 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}
