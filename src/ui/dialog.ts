// Promise-based in-app dialogs, a drop-in replacement for window.prompt /
// confirm / alert — which the Tauri webview blocks. A single <Dialogs/> mounted
// in App renders whatever request is active; the helpers below create a request
// and resolve when the user acts, so callers just `await promptText(...)`.

import { create } from 'zustand'

export type DialogKind = 'prompt' | 'confirm' | 'alert'

export interface DialogRequest {
  kind: DialogKind
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  okLabel?: string
  cancelLabel?: string
  /** For prompts: return an error string to block submit, or null if valid. */
  validate?: (value: string) => string | null
  resolve: (value: string | boolean | null) => void
}

interface DialogState {
  current: DialogRequest | null
  show: (req: DialogRequest) => void
  clear: () => void
}

export const useDialog = create<DialogState>((set) => ({
  current: null,
  show: (req) => set({ current: req }),
  clear: () => set({ current: null })
}))

function request(req: Omit<DialogRequest, 'resolve'>): Promise<string | boolean | null> {
  return new Promise((resolve) => {
    useDialog.getState().show({
      ...req,
      resolve: (v) => {
        useDialog.getState().clear()
        resolve(v)
      }
    })
  })
}

export async function promptText(
  opts: { title: string; message?: string; defaultValue?: string; placeholder?: string; okLabel?: string; validate?: (v: string) => string | null }
): Promise<string | null> {
  const v = await request({ kind: 'prompt', ...opts })
  return typeof v === 'string' ? v : null
}

export async function confirmDialog(
  opts: { title: string; message?: string; okLabel?: string; cancelLabel?: string }
): Promise<boolean> {
  const v = await request({ kind: 'confirm', ...opts })
  return v === true
}

export async function alertDialog(opts: { title: string; message?: string }): Promise<void> {
  await request({ kind: 'alert', okLabel: 'OK', ...opts })
}
