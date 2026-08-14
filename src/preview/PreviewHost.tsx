import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { CRTScreen } from 'rpg-prop-kit'
import 'rpg-prop-kit/styles.css'
import {
  complete,
  makeT,
  renderFileContent,
  runCommand,
  scoreGuess,
  isWin,
  type Vfs,
  type VfsFile
} from 'rpgterm-engine'
import { useT } from '../i18n'
import type { Project } from '../model/types'
import { composeProject } from './compose'

type Line = {
  text?: string
  type?: string
  duration?: number
  label?: string
  onComplete?: () => void
  path?: string
  node?: VfsFile
  message?: string
  hint?: string
  instant?: boolean
}

type Prompt =
  | { kind: 'password'; path: string; node: VfsFile }
  | { kind: 'crack'; path: string; node: VfsFile }
  | { kind: 'decrypt'; path: string; node: VfsFile; guesses: string[] }

function asCrt(theme: Record<string, unknown>) {
  const crt = (theme.crt ?? {}) as Record<string, unknown>
  const n = (k: string, fallback: number) =>
    typeof crt[k] === 'number' ? (crt[k] as number) : fallback
  return {
    scanlines: n('scanlines', 0.2) > 0,
    flicker: n('flicker', 0.1) > 0,
    curvature: n('curve', 0.5) > 0,
    glow: typeof crt.glow === 'string' ? crt.glow : '8px'
  }
}

function paletteStyle(theme: Record<string, unknown>): CSSProperties {
  const p = (theme.palette ?? {}) as Record<string, string>
  const crt = asCrt(theme)
  return {
    ['--rpk-bg' as string]: p.bg ?? '#000',
    ['--rpk-bg-soft' as string]: p.bgSoft ?? '#001a00',
    ['--rpk-fg' as string]: p.fg ?? '#33ff33',
    ['--rpk-accent' as string]: p.accent ?? '#88ff88',
    ['--rpk-muted' as string]: p.muted ?? '#1a661a',
    ['--rpk-error' as string]: p.error ?? '#ff4444',
    ['--rpk-glow' as string]: crt.glow,
    ['--rpk-font' as string]: typeof theme.font === 'string' ? theme.font : 'ui-monospace, monospace',
    height: '100%',
    minHeight: 0
  }
}

function lineClass(type?: string) {
  if (type === 'err' || type === 'error') return 'host-line host-line--err'
  if (type === 'ok') return 'host-line host-line--ok'
  if (type === 'muted' || type === 'user') return 'host-line host-line--muted'
  return 'host-line'
}

export function PreviewHost({ project, lang }: { project: Project; lang: string }) {
  const tUi = useT()
  const theme = useMemo(() => composeProject(project, lang), [project, lang])
  const crt = asCrt(theme)
  const translator = useMemo(() => makeT(lang), [lang])

  const [cwd, setCwd] = useState('/')
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set())
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const unlockedRef = useRef(unlocked)
  unlockedRef.current = unlocked
  const cwdRef = useRef(cwd)
  cwdRef.current = cwd
  const themeRef = useRef(theme)
  themeRef.current = theme
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const push = useCallback((more: Line[]) => {
    setLines((prev) => [...prev, ...more])
  }, [])

  const unlock = useCallback((path: string) => {
    setUnlocked((prev) => {
      const next = new Set(prev)
      next.add(path)
      return next
    })
  }, [])

  const boot = useCallback(() => {
    setCwd('/')
    setUnlocked(new Set())
    setPrompt(null)
    setHint(null)
    const bootLines = Array.isArray(theme.boot) ? (theme.boot as Line[]) : []
    const motd = Array.isArray(theme.motd)
      ? (theme.motd as string[]).map((text) => ({ text }))
      : []
    setLines([...bootLines, ...motd, { text: '', instant: true }])
  }, [theme])

  useEffect(() => {
    boot()
  }, [boot])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lines, prompt])

  const run = useCallback(
    (raw: string) => {
      const current = themeRef.current
      const fs = (current.filesystem ?? {}) as Vfs
      const t = translator
      const out = runCommand(raw, {
        theme: current,
        fs,
        cwd: cwdRef.current,
        setCwd: (p: string) => setCwd(p),
        clear: () => setLines([]),
        reboot: boot,
        unlocked: unlockedRef.current,
        unlock,
        t,
        lang,
        openPasswordPrompt: (path: string, node: VfsFile) => setPrompt({ kind: 'password', path, node }),
        openCrackPrompt: (path: string, node: VfsFile) => setPrompt({ kind: 'crack', path, node }),
        openDecryptGame: (path: string, node: VfsFile) =>
          setPrompt({ kind: 'decrypt', path, node, guesses: [] }),
        openFileViewer: (path: string, node: VfsFile) => {
          push(renderFileContent(path, node) as Line[])
        }
      }) as Line[]
      const printable: Line[] = []
      for (const line of out) {
        if (line.type === 'fileview' && line.path && line.node) {
          printable.push(...(renderFileContent(line.path, line.node) as Line[]))
          continue
        }
        if (line.type === 'helpview') {
          const extra = (current.extraHelp as string[] | undefined) ?? []
          printable.push({ text: extra.join('\n') || 'ls  cd  cat  check  crack  unlock  decrypt  query', type: 'muted' })
          continue
        }
        if (line.type === 'failure') {
          printable.push({ text: String(line.message ?? 'failed'), type: 'err' })
          if (line.hint) printable.push({ text: String(line.hint), type: 'muted' })
          continue
        }
        if (line.type === 'progress') {
          printable.push({ text: `[${line.label ?? '…'}]`, type: 'muted' })
          line.onComplete?.()
          continue
        }
        printable.push(line)
      }
      if (printable.length) push(printable)
      push([{ text: '', instant: true }])
    },
    [boot, lang, push, translator, unlock]
  )

  const submit = (raw: string) => {
    const sigil = `${(theme.prompt as string) ?? '$'} ${cwd === '/' ? '/' : cwd} >`
    push([{ text: `${sigil} ${raw}`, type: 'user' }])
    if (raw.trim()) run(raw)
    setInput('')
    setHint(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(input)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const { value, list } = complete(input, {
        theme,
        fs: theme.filesystem,
        cwd
      })
      setInput(value)
      setHint(list.length ? list.join('  ') : null)
    }
  }

  const shortName = typeof theme.shortName === 'string' ? theme.shortName : ''
  const header = typeof theme.header === 'string' ? theme.header : ''

  return (
    <div className="host" style={paletteStyle(theme)}>
      <CRTScreen
        scanlines={crt.scanlines}
        flicker={crt.flicker}
        curvature={crt.curvature}
        sweep
        vignette
        style={{ height: '100%' }}
      >
        <div className="host-inner">
          {(header || shortName) && (
            <div className="host-plate">
              {shortName && <span className="host-short">{shortName}</span>}
              {header && <span className="host-header">{header}</span>}
            </div>
          )}
          <div className="host-scroll" onClick={() => inputRef.current?.focus()}>
            {lines.map((l, i) => (
              <div key={i} className={lineClass(l.type)}>
                {l.text ?? ''}
              </div>
            ))}
            {prompt && (
              <PromptBox
                prompt={prompt}
                onCancel={() => setPrompt(null)}
                onUnlock={(path) => {
                  unlock(path)
                  setPrompt(null)
                  push([{ text: tUi('desbloqueado', 'unlocked'), type: 'ok' }])
                }}
                t={tUi}
              />
            )}
            <div className="host-prompt">
              <span className="host-line--muted">
                {(theme.prompt as string) ?? '$'} {cwd} &gt;
              </span>
              <input
                ref={inputRef}
                className="host-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoFocus
                aria-label="command"
              />
            </div>
            {hint && <div className="host-line host-line--muted">{hint}</div>}
            <div ref={bottomRef} />
          </div>
        </div>
      </CRTScreen>
    </div>
  )
}

function PromptBox({
  prompt,
  onCancel,
  onUnlock,
  t
}: {
  prompt: Prompt
  onCancel: () => void
  onUnlock: (path: string) => void
  t: (pt: string, en: string) => string
}) {
  const [value, setValue] = useState('')
  const [guesses, setGuesses] = useState<string[]>(prompt.kind === 'decrypt' ? prompt.guesses : [])

  if (prompt.kind === 'password') {
    return (
      <div className="host-modal">
        <div>{t('Senha para', 'Password for')} {prompt.path}</div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (value === String(prompt.node.password ?? '')) onUnlock(prompt.path)
            else setValue('')
          }}
        >
          <input
            className="host-input"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </form>
        <button type="button" onClick={onCancel}>
          {t('Cancelar', 'Cancel')}
        </button>
      </div>
    )
  }

  if (prompt.kind === 'crack') {
    const dc = prompt.node.crackDC
    return (
      <div className="host-modal">
        <div>
          crack {prompt.path}
          {dc != null ? ` · DC ${dc}` : ''}
        </div>
        <button type="button" onClick={() => onUnlock(prompt.path)}>
          {t('Simular sucesso', 'Simulate success')}
        </button>
        <button type="button" onClick={onCancel}>
          {t('Cancelar', 'Cancel')}
        </button>
      </div>
    )
  }

  const target = String(prompt.node.decryptTarget ?? '')
  return (
    <div className="host-modal">
      <div>decrypt {prompt.path}</div>
      {guesses.map((g, i) => (
        <div key={i} className="host-line">
          {g} {scoreGuess(g, target).join(' ')}
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const g = value.trim().toLowerCase()
          if (!g) return
          if (isWin(g, target)) onUnlock(prompt.path)
          else {
            setGuesses((prev) => [...prev, g])
            setValue('')
          }
        }}
      >
        <input className="host-input" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      </form>
      <button type="button" onClick={onCancel}>
        {t('Cancelar', 'Cancel')}
      </button>
    </div>
  )
}
