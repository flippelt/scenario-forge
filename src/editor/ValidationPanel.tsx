import { useStore } from '../model/store'
import { validateProject, type Issue } from '../validation/rules'

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <div className="issue">
      <span className={`tag ${issue.severity}`}>{issue.severity === 'error' ? 'ERRO' : 'AVISO'}</span>
      <div>
        {issue.path && <span className="path">{issue.path} </span>}
        {issue.message}
      </div>
    </div>
  )
}

export function ValidationPanel() {
  const project = useStore((s) => s.project)
  const issues = validateProject(project)
  const errors = issues.filter((i) => i.severity === 'error').length
  const warns = issues.length - errors

  return (
    <details className="validation" open={errors > 0}>
      <summary>
        Validação —{' '}
        {issues.length === 0 ? (
          <span className="ok">tudo certo ✓</span>
        ) : (
          <>
            <span className="tag error" style={{ display: errors ? 'inline' : 'none' }}>
              {errors} erro(s)
            </span>{' '}
            <span className="tag warn" style={{ display: warns ? 'inline' : 'none' }}>
              {warns} aviso(s)
            </span>
          </>
        )}
      </summary>
      <div style={{ marginTop: '0.5rem' }}>
        {issues.map((i, idx) => (
          <IssueRow key={idx} issue={i} />
        ))}
      </div>
    </details>
  )
}
