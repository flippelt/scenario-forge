import { useState, useEffect } from 'react'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import { SYSTEMS, type ScenarioMeta } from '../model/types'
import { DialogEditor } from './DialogEditor'
import { EventsEditor } from './EventsEditor'
import { TracerEditor } from './TracerEditor'

// Friendly fields get forms; everything else round-trips through an advanced
// JSON editor so nothing in scenario.json is ever lost. `dialog` has its own
// form (DialogEditor), so it's friendly too.
const FRIENDLY_KEYS = ['id', 'name', 'header', 'prompt', 'user', 'motd', 'checkMisleadsOnFail', 'dialog', 'events', 'tracer']

function advancedOf(meta: ScenarioMeta): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (!FRIENDLY_KEYS.includes(k)) out[k] = v
  }
  return out
}

export function ScenarioPanel() {
  const t = useT()
  const meta = useStore((s) => s.project.meta)
  const theme = useStore((s) => s.project.theme)
  const setMeta = useStore((s) => s.setMeta)
  const setTheme = useStore((s) => s.setTheme)
  const replaceMeta = useStore((s) => s.replaceMeta)

  const [advText, setAdvText] = useState(() => JSON.stringify(advancedOf(meta), null, 2))
  const [advErr, setAdvErr] = useState<string | null>(null)

  // Resync the advanced editor when the scenario changes underneath it
  // (new/open/import), but not on every keystroke of the friendly fields.
  useEffect(() => {
    setAdvText(JSON.stringify(advancedOf(meta), null, 2))
    setAdvErr(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id])

  const applyAdvanced = (text: string) => {
    setAdvText(text)
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setAdvErr(t('O JSON avançado precisa ser um objeto.', 'The advanced JSON must be an object.'))
        return
      }
      setAdvErr(null)
      const friendly: ScenarioMeta = { id: meta.id }
      for (const k of FRIENDLY_KEYS) if (meta[k] !== undefined) friendly[k] = meta[k]
      replaceMeta({ ...friendly, ...parsed } as ScenarioMeta)
    } catch (e) {
      setAdvErr(e instanceof Error ? e.message : t('JSON inválido', 'Invalid JSON'))
    }
  }

  const motdText = (meta.motd ?? []).join('\n')

  return (
    <div className="col">
      <p className="col-title">scenario.json</p>

      <div className="form-row">
        <label>{t('Sistema (tema)', 'System (theme)')}</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
          {SYSTEMS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="help">{t('Define a pasta de destino no repo:', 'Sets the target folder in the repo:')} scenarios/{theme}/{meta.id || '…'}/</div>
      </div>

      <div className="form-row">
        <label>id</label>
        <input type="text" value={meta.id ?? ''} onChange={(e) => setMeta({ id: e.target.value })} />
        <div className="help">{t('Identificador da pasta. Sem espaços (ex.: heimdall).', 'Folder identifier. No spaces (e.g. heimdall).')}</div>
      </div>

      <div className="form-row">
        <label>name</label>
        <input type="text" value={meta.name ?? ''} onChange={(e) => setMeta({ name: e.target.value })} />
      </div>

      <div className="form-row">
        <label>header</label>
        <input type="text" value={meta.header ?? ''} onChange={(e) => setMeta({ header: e.target.value })} />
        <div className="help">{t('Cabeçalho da barra do terminal (opcional; herda do tema).', 'Terminal title-bar header (optional; inherits from theme).')}</div>
      </div>

      <div className="form-row">
        <label>prompt</label>
        <input type="text" value={meta.prompt ?? ''} onChange={(e) => setMeta({ prompt: e.target.value })} />
      </div>

      <div className="form-row">
        <label>user (whoami)</label>
        <input type="text" value={meta.user ?? ''} onChange={(e) => setMeta({ user: e.target.value })} />
      </div>

      <div className="form-row">
        <label>{t('motd (uma linha por entrada)', 'motd (one line per entry)')}</label>
        <textarea
          rows={5}
          spellCheck={false}
          value={motdText}
          onChange={(e) => setMeta({ motd: e.target.value.split('\n') })}
        />
        <div className="help">{t('Banner inicial mostrado ao abrir o terminal.', 'Opening banner shown when the terminal loads.')}</div>
      </div>

      <div className="form-row">
        <label>
          <input
            type="checkbox"
            style={{ width: 'auto', marginRight: '0.4rem' }}
            checked={meta.checkMisleadsOnFail === true}
            onChange={(e) => setMeta({ checkMisleadsOnFail: e.target.checked })}
          />
          checkMisleadsOnFail
        </label>
        <div className="help">{t('Um `check` falho dá uma leitura ENGANOSA da vigilância, em vez de “inconclusivo”.', 'A failed `check` gives a MISLEADING surveillance reading instead of “inconclusive”.')}</div>
      </div>

      <details className="advanced">
        <summary>{t('Diálogo (query / ask)', 'Dialog (query / ask)')}</summary>
        <p className="help">
          {t('Respostas do banco de dados conversacional — o que ', 'Conversational database answers — what ')}
          <code>query &lt;{t('assunto', 'subject')}&gt;</code> / <code>ask</code>
          {t(' respondem (ex.: a MU/TH/UR no tema alien).', ' reply (e.g. MU/TH/UR in the alien theme).')}
        </p>
        <DialogEditor />
      </details>

      <details className="advanced">
        <summary>{t('Eventos (ao desbloquear um arquivo)', 'Events (on unlocking a file)')}</summary>
        <p className="help">
          {t('Linhas que tocam logo após um arquivo ser desbloqueado — alarme, recado do vilão, uma contagem regressiva (',
            'Lines that play right after a file is unlocked — alarm, villain’s message, a countdown (')}
          <code>countdown</code>).
        </p>
        <EventsEditor />
      </details>

      <details className="advanced">
        <summary>{t('Tracer / rastreador', 'Tracer')}</summary>
        <p className="help">
          {t('O cronômetro de ICE/recon que um arquivo vigiado (', 'The ICE/recon timer a watched file (')}
          <code>tracer: true</code>{t(') arma.', ') arms.')}
        </p>
        <TracerEditor />
      </details>

      <details className="advanced">
        <summary>{t('Avançado (commands, aliases, locks, boot, selfDestruct, i18n…)', 'Advanced (commands, aliases, locks, boot, selfDestruct, i18n…)')}</summary>
        <p className="help">
          {t('Edição direta do restante do scenario.json. Tudo aqui é preservado no round-trip.',
            'Direct edit of the rest of scenario.json. Everything here round-trips intact.')}
        </p>
        <textarea
          rows={16}
          spellCheck={false}
          style={{ fontFamily: 'var(--mono)' }}
          value={advText}
          onChange={(e) => applyAdvanced(e.target.value)}
        />
        {advErr && <div className="json-error">⚠ {advErr}</div>}
      </details>
    </div>
  )
}
