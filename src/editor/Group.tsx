import type { ReactNode } from 'react'

// One block of the side menu. Starts closed; `sub` says what is inside so the
// closed menu still reads as a table of contents.
export function Group({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <details className="panel-group">
      <summary>
        <span className="panel-title">{title}</span>
        <small className="panel-sub">{sub}</small>
      </summary>
      <div className="panel-body">{children}</div>
    </details>
  )
}
