import { THEME_REGISTRY } from 'rpgterm-engine'
import { useStore } from '../model/store'
import { useT } from '../i18n'
import type { CrtKnobs } from '../model/types'

const SLIDERS: { key: keyof CrtKnobs; max: number; step: number; label: { pt: string; en: string } }[] = [
  { key: 'scanlines', max: 1, step: 0.01, label: { pt: 'Scanlines', en: 'Scanlines' } },
  { key: 'flicker', max: 1, step: 0.01, label: { pt: 'Flicker', en: 'Flicker' } },
  { key: 'curve', max: 2, step: 0.05, label: { pt: 'Curva', en: 'Curve' } },
  { key: 'bloom', max: 2, step: 0.05, label: { pt: 'Bloom', en: 'Bloom' } }
]

const HEX: { key: keyof CrtKnobs; label: string }[] = [
  { key: 'bezel', label: 'bezel' },
  { key: 'bezelHi', label: 'bezelHi' },
  { key: 'led', label: 'led' }
]

function themeCrt(themeId: string): CrtKnobs {
  const skin = THEME_REGISTRY[themeId]
  return ((skin?.crt as CrtKnobs | undefined) ?? {}) as CrtKnobs
}

export function CrtEditor() {
  const t = useT()
  const themeId = useStore((s) => s.project.theme)
  const meta = useStore((s) => s.project.meta)
  const setMeta = useStore((s) => s.setMeta)
  const defaults = themeCrt(themeId)
  const crt = { ...defaults, ...((meta.crt as CrtKnobs | undefined) ?? {}) }

  const patch = (partial: Partial<CrtKnobs> | { shortName?: string }) => {
    if ('shortName' in partial) {
      setMeta({ shortName: partial.shortName || undefined })
      return
    }
    const next: CrtKnobs = { ...((meta.crt as CrtKnobs | undefined) ?? {}), ...partial }
    for (const [k, v] of Object.entries(next)) {
      if (v === '' || v == null) delete next[k as keyof CrtKnobs]
    }
    setMeta({ crt: Object.keys(next).length ? next : undefined })
  }

  const num = (k: keyof CrtKnobs, fallback: number) =>
    typeof crt[k] === 'number' ? (crt[k] as number) : fallback

  return (
    <div className="crt-editor">
      <div className="form-row">
        <label>shortName</label>
        <input
          type="text"
          value={typeof meta.shortName === 'string' ? meta.shortName : ''}
          placeholder={String(THEME_REGISTRY[themeId]?.shortName ?? '')}
          onChange={(e) => patch({ shortName: e.target.value })}
        />
        <div className="help">
          {t('Nome curto na placa do tubo (herda do tema se vazio).', 'Short name on the CRT plate (inherits from the theme if empty).')}
        </div>
      </div>

      {SLIDERS.map((s) => {
        const value = num(s.key, s.key === 'bloom' || s.key === 'curve' ? 1 : 0.2)
        return (
          <div className="form-row" key={s.key}>
            <label>
              {t(s.label.pt, s.label.en)} <span className="muted">{value.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={s.max}
              step={s.step}
              value={value}
              onChange={(e) => patch({ [s.key]: Number(e.target.value) })}
            />
          </div>
        )
      })}

      {HEX.map((h) => (
        <div className="form-row" key={h.key}>
          <label>{h.label}</label>
          <input
            type="text"
            value={typeof crt[h.key] === 'string' ? String(crt[h.key]) : ''}
            placeholder={typeof defaults[h.key] === 'string' ? String(defaults[h.key]) : '#000000'}
            onChange={(e) => patch({ [h.key]: e.target.value })}
          />
        </div>
      ))}

      <div className="form-row">
        <label>plate</label>
        <input
          type="text"
          value={typeof crt.plate === 'string' ? crt.plate : ''}
          placeholder={typeof defaults.plate === 'string' ? defaults.plate : ''}
          onChange={(e) => patch({ plate: e.target.value })}
        />
      </div>
    </div>
  )
}
