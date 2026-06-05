import { useStore } from '../model/store'
import { useT } from '../i18n'
import { validateProject, type Issue } from '../validation/rules'

function IssueRow({ issue }: { issue: Issue }) {
  const t = useT()
  return (
    <div className="issue">
      <span className={`tag ${issue.severity}`}>{issue.severity === 'error' ? t('ERRO', 'ERROR') : t('AVISO', 'WARNING')}</span>
      <div>
        {issue.path && <span className="path">{issue.path} </span>}
        {t(issue.message.pt, issue.message.en)}
      </div>
    </div>
  )
}

export function ValidationPanel() {
  const t = useT()
  const project = useStore((s) => s.project)
  const issues = validateProject(project)
  const errors = issues.filter((i) => i.severity === 'error').length
  const warns = issues.length - errors

  return (
    <details className="validation" open={errors > 0}>
      <summary>
        {t('Validação', 'Validation')} —{' '}
        {issues.length === 0 ? (
          <span className="ok">{t('tudo certo ✓', 'all good ✓')}</span>
        ) : (
          <>
            <span className="tag error" style={{ display: errors ? 'inline' : 'none' }}>
              {t(`${errors} erro(s)`, `${errors} error(s)`)}
            </span>{' '}
            <span className="tag warn" style={{ display: warns ? 'inline' : 'none' }}>
              {t(`${warns} aviso(s)`, `${warns} warning(s)`)}
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
