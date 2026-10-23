import { create } from 'zustand'

// Which part of the terminal the focused menu field edits (opord's data-edit).
// Kept out of the project store so it never lands in undo history.
export const useEditFocus = create<{ key: string; setKey: (key: string) => void }>((set) => ({
  key: '',
  setKey: (key) => set({ key })
}))

/** Opens the menu block that holds [data-edit=key] and focuses its field. */
export function jumpToField(key: string) {
  const row = document.querySelector<HTMLElement>(`.desk [data-edit="${key}"]`)
  if (!row) return
  const block = row.closest('details')
  if (block) block.open = true
  row.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  row.querySelector<HTMLElement>('input, textarea, select')?.focus()
}
