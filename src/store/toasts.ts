import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'default' | 'error'
  action?: { label: string; run: () => void }
}

interface ToastState {
  toasts: Toast[]
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Shows a short confirmation at the bottom of the workspace; it leaves on its own. */
export function toast(message: string, options: { action?: Toast['action']; tone?: Toast['tone'] } = {}): void {
  const id = nextId++
  // One line of feedback at a time is enough; the newest replaces the rest.
  useToasts.setState({ toasts: [{ id, message, tone: options.tone ?? 'default', action: options.action }] })
  setTimeout(() => useToasts.getState().dismiss(id), options.action ? 6000 : 3200)
}
