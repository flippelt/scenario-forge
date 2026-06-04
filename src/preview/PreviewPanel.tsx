import { useMemo, useState } from 'react'
import { encodeBundle } from 'rpgterm-engine'
import { useStore } from '../model/store'
import { toRuntimeBundle } from '../model/serialize'

// The deployed terminal reads a whole scenario from `?scenario64=<bundle>`
// (share.js). We embed it in an iframe and pass the editor's current bundle —
// a live preview running the REAL terminal, no engine duplication.
const TERMINAL_URL = 'https://flippelt.github.io/Immersive-Terminal-for-RPGs/'

// Browsers cap URL length; warn well before the practical iframe limit.
const URL_WARN = 30000

export function PreviewPanel({ onClose }: { onClose: () => void }) {
  const project = useStore((s) => s.project)
  // `nonce` forces a fresh iframe (remount) on manual refresh.
  const [nonce, setNonce] = useState(0)

  const { url, size, tooBig } = useMemo(() => {
    const token = encodeBundle(toRuntimeBundle(project))
    const u = `${TERMINAL_URL}?scenario64=${token}`
    return { url: u, size: token.length, tooBig: token.length > URL_WARN }
  }, [project, nonce])

  return (
    <div className="preview-overlay">
      <div className="preview-bar">
        <span className="brand">▶ Preview</span>
        <span className="muted">terminal real · {(size / 1024).toFixed(1)} kB</span>
        {tooBig && (
          <span className="tag warn" title="URL muito longa; pode não carregar">
            cenário grande
          </span>
        )}
        <span className="spacer" />
        <button onClick={() => setNonce((n) => n + 1)}>↻ Atualizar</button>
        <a className="ext-link" href={url} target="_blank" rel="noreferrer">
          Abrir no navegador ↗
        </a>
        <button className="primary" onClick={onClose}>
          Fechar
        </button>
      </div>
      {tooBig ? (
        <div className="empty">
          O cenário ficou grande demais para caber na URL do preview ({(size / 1024).toFixed(0)} kB).
          Use “Abrir no navegador” ou reduza o conteúdo. (Preview por postMessage/dist local fica para depois.)
        </div>
      ) : (
        <iframe key={nonce} className="preview-frame" src={url} title="Immersive Terminal preview" />
      )}
    </div>
  )
}
