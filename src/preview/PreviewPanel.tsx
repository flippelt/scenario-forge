import { useEffect, useMemo, useState } from 'react'
import { encodeBundle } from 'rpgterm-engine'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { toRuntimeBundle } from '../model/serialize'
import { PreviewHost } from './PreviewHost'
import {
  ENGINE_VERSION,
  compareVersions,
  fetchPublishedEngineVersion,
  type VersionReport
} from './engineVersion'

const TERMINAL_URL = 'https://flippelt.github.io/Immersive-Terminal-for-RPGs/'
const URL_WARN = 30000

export function PreviewPanel({ onClose }: { onClose: () => void }) {
  const t = useT()
  const project = useStore((s) => s.project)
  const locale = useStore((s) => s.locale)
  const [report, setReport] = useState<VersionReport>({
    editor: ENGINE_VERSION,
    published: null,
    drift: false
  })

  useEffect(() => {
    const ac = new AbortController()
    fetchPublishedEngineVersion(ac.signal).then((published) => {
      setReport(compareVersions(ENGINE_VERSION, published))
    })
    return () => ac.abort()
  }, [])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { extUrl, tooBig } = useMemo(() => {
    const token = encodeBundle(toRuntimeBundle(project))
    return {
      extUrl: `${TERMINAL_URL}?scenario64=${token}`,
      tooBig: token.length > URL_WARN
    }
  }, [project])

  const lang = locale === 'pt' ? 'pt' : 'en'

  return (
    <div className="preview-overlay">
      <div className="preview-bar">
        <span className="brand">▶ Preview</span>
        <span className="muted">{t('engine local', 'local engine')}</span>
        <VersionBadge report={report} />
        <span className="spacer" />
        <a
          className="ext-link"
          href={extUrl}
          target="_blank"
          rel="noreferrer"
          title={
            tooBig
              ? t(
                  'Cenário grande: o link da Pages pode falhar; o preview daqui usa o engine local.',
                  'Large scenario: the Pages link may fail; this preview uses the local engine.'
                )
              : t('Abre o terminal publicado (pode estar numa versão diferente).', 'Opens the published terminal (may be a different version).')
          }
        >
          {t('Abrir no terminal publicado', 'Open published terminal')} ↗{tooBig ? ' ⚠' : ''}
        </a>
        <button className="primary" onClick={onClose}>
          {t('Fechar', 'Close')}
        </button>
      </div>
      <PreviewHost project={project} lang={lang} />
    </div>
  )
}

export function VersionBadge({ report }: { report: VersionReport }) {
  const t = useT()
  if (!report.published) {
    return (
      <span className="version-badge" title={t('Não deu para consultar o ITR publicado.', 'Could not reach the published ITR.')}>
        rpgterm-engine {report.editor}
      </span>
    )
  }
  return (
    <span
      className={`version-badge ${report.drift ? 'version-badge--drift' : ''}`}
      title={
        report.drift
          ? t(
              'O terminal publicado está noutra versão do engine. Este preview usa o pin do editor.',
              'The published terminal is on another engine version. This preview uses the editor pin.'
            )
          : t('Editor e terminal publicado no mesmo engine.', 'Editor and published terminal share the same engine.')
      }
    >
      {t('editor', 'editor')} {report.editor}
      {' · '}
      {t('publicado', 'published')} {report.published}
      {report.drift ? ` · ${t('deriva', 'drift')}` : ''}
    </span>
  )
}
