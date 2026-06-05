import { useEffect, useMemo, useRef } from 'react'
import { encodeBundle } from 'rpgterm-engine'
import { useStore } from '../model/store'
import { toRuntimeBundle } from '../model/serialize'

// Live preview: embed the deployed terminal and push the current scenario via
// postMessage (handshake: the terminal pings `rpgterm:ready` on mount, we reply
// with `rpgterm:load`). No URL-length limit, so big campaigns preview fine.
// The "open in browser" link still uses ?scenario64= for sharing outside.
const TERMINAL_URL = 'https://flippelt.github.io/Immersive-Terminal-for-RPGs/'
const TERMINAL_ORIGIN = 'https://flippelt.github.io'
const URL_WARN = 30000

export function PreviewPanel({ onClose }: { onClose: () => void }) {
  const project = useStore((s) => s.project)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const bundle = useMemo(() => toRuntimeBundle(project), [project])
  // Latest bundle in a ref so the ready-handler/refresh always send current.
  const bundleRef = useRef(bundle)
  bundleRef.current = bundle

  const send = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'rpgterm:load', bundle: bundleRef.current },
      TERMINAL_ORIGIN
    )
  }

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === TERMINAL_ORIGIN && (e.data as { type?: string })?.type === 'rpgterm:ready') {
        send()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External link (carries the bundle in the URL); only relevant for sharing
  // outside the editor, where the size cap applies.
  const { extUrl, size, tooBig } = useMemo(() => {
    const token = encodeBundle(bundle)
    return {
      extUrl: `${TERMINAL_URL}?scenario64=${token}`,
      size: token.length,
      tooBig: token.length > URL_WARN
    }
  }, [bundle])

  return (
    <div className="preview-overlay">
      <div className="preview-bar">
        <span className="brand">▶ Preview</span>
        <span className="muted">terminal real · {(size / 1024).toFixed(1)} kB</span>
        <span className="spacer" />
        <button onClick={send}>↻ Atualizar</button>
        <a
          className="ext-link"
          href={extUrl}
          target="_blank"
          rel="noreferrer"
          title={tooBig ? 'Cenário grande: o link pode não abrir, mas o preview embutido (postMessage) funciona' : ''}
        >
          Abrir no navegador ↗{tooBig ? ' ⚠' : ''}
        </a>
        <button className="primary" onClick={onClose}>
          Fechar
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="preview-frame"
        src={TERMINAL_URL}
        title="Immersive Terminal preview"
        onLoad={send}
      />
    </div>
  )
}
