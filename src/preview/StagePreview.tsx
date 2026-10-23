import { useStore } from '../model/store'
import { useT } from '../i18n'
import { PreviewHost } from './PreviewHost'
import { jumpToField, useEditFocus } from '../editor/editFocus'

// The terminal beside the Geral menu. It reboots on every change, so header,
// motd and the CRT knobs show up as they are typed. Full screen (with GPU and
// the published-terminal link) stays in the ▶ Preview overlay. Clicking the
// plate, the motd or the prompt jumps to that field; the focused field lights up here.
export function StagePreview({ onFullscreen }: { onFullscreen: () => void }) {
  const t = useT()
  const project = useStore((s) => s.project)
  const locale = useStore((s) => s.locale)
  const lit = useEditFocus((s) => s.key)

  return (
    <div className="stage-preview">
      <div className="stage-bar">
        <span className="muted">{t('Terminal ao vivo', 'Live terminal')}</span>
        <span className="spacer" />
        <button type="button" onClick={onFullscreen}>
          ▶ {t('Tela cheia', 'Full screen')}
        </button>
      </div>
      <PreviewHost project={project} lang={locale === 'pt' ? 'pt' : 'en'} autoFocus={false} lit={lit} onPick={jumpToField} />
    </div>
  )
}
