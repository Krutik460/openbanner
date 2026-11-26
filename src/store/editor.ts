import { create } from 'zustand'
import { BANNER } from '@/lib/constants'
import { blankDoc } from '@/lib/templates'
import type { Background, BannerDoc, BannerElement, Device, Profile } from '@/lib/types'
import { uid } from '@/lib/util'

const HISTORY_LIMIT = 100
/** Edits sharing a key within this window (a slider drag, typing) undo as one step. */
const COALESCE_MS = 800

export type SaveState = 'saved' | 'saving' | 'error'

interface EditorState {
  screen: 'loading' | 'welcome' | 'editor'
  profile: Profile | null
  doc: BannerDoc
  past: BannerDoc[]
  future: BannerDoc[]
  selection: string[]
  editingId: string | null
  clipboard: BannerElement[]
  device: Device
  showProfile: boolean
  showSafeZones: boolean
  saveState: SaveState

  setScreen: (screen: EditorState['screen']) => void
  setProfile: (profile: Profile | null) => void
  /** Swap in a different design; clears history and selection. */
  openDoc: (doc: BannerDoc) => void
  /** Apply an undoable change to the current design. */
  mutate: (recipe: (doc: BannerDoc) => BannerDoc, coalesceKey?: string) => void
  patchElements: (ids: string[], patch: Partial<BannerElement> | ((el: BannerElement) => Partial<BannerElement>), coalesceKey?: string) => void
  setBackground: (patch: Partial<Background>, coalesceKey?: string) => void
  addElements: (elements: BannerElement[]) => void
  removeSelected: () => void
  duplicateSelected: () => void
  copy: () => void
  paste: () => void
  reorder: (to: 'front' | 'back' | 'forward' | 'backward') => void
  nudge: (dx: number, dy: number) => void
  rename: (name: string) => void
  undo: () => void
  redo: () => void
  select: (ids: string[]) => void
  toggleSelect: (id: string) => void
  setEditing: (id: string | null) => void
  setView: (view: Partial<Pick<EditorState, 'device' | 'showProfile' | 'showSafeZones'>>) => void
  setSaveState: (state: SaveState) => void
}

let lastKey: string | undefined
let lastAt = 0

const clone = (el: BannerElement, dx = 0, dy = 0): BannerElement => ({ ...el, id: uid(), x: el.x + dx, y: el.y + dy })

export const useEditor = create<EditorState>((set, get) => ({
  screen: 'loading',
  profile: null,
  doc: blankDoc(),
  past: [],
  future: [],
  selection: [],
  editingId: null,
  clipboard: [],
  device: 'desktop',
  showProfile: true,
  showSafeZones: false,
  saveState: 'saved',

  setScreen: (screen) => set({ screen }),
  setProfile: (profile) => set({ profile }),

  openDoc: (doc) => {
    lastKey = undefined
    set({ doc, past: [], future: [], selection: [], editingId: null })
  },

  mutate: (recipe, coalesceKey) => {
    const { doc, past } = get()
    const next = recipe(doc)
    if (next === doc) return
    const now = Date.now()
    const coalesce = coalesceKey !== undefined && coalesceKey === lastKey && now - lastAt < COALESCE_MS
    lastKey = coalesceKey
    lastAt = now
    set({
      doc: { ...next, updatedAt: now },
      past: coalesce ? past : [...past.slice(-HISTORY_LIMIT + 1), doc],
      future: [],
    })
  },

  patchElements: (ids, patch, coalesceKey) => {
    if (ids.length === 0) return
    const targets = new Set(ids)
    get().mutate(
      (doc) => ({
        ...doc,
        elements: doc.elements.map((el) =>
          targets.has(el.id) ? ({ ...el, ...(typeof patch === 'function' ? patch(el) : patch) } as BannerElement) : el,
        ),
      }),
      coalesceKey,
    )
  },

  setBackground: (patch, coalesceKey) =>
    get().mutate((doc) => ({ ...doc, background: { ...doc.background, ...patch } }), coalesceKey),

  addElements: (elements) => {
    get().mutate((doc) => ({ ...doc, elements: [...doc.elements, ...elements] }))
    set({ selection: elements.map((el) => el.id), editingId: null })
  },

  removeSelected: () => {
    const targets = new Set(get().selection)
    if (targets.size === 0) return
    get().mutate((doc) => ({ ...doc, elements: doc.elements.filter((el) => !targets.has(el.id)) }))
    set({ selection: [], editingId: null })
  },

  duplicateSelected: () => {
    const { selection, doc } = get()
    const copies = doc.elements.filter((el) => selection.includes(el.id)).map((el) => clone(el, 24, 24))
    if (copies.length) get().addElements(copies)
  },

  copy: () => {
    const { selection, doc } = get()
    const picked = doc.elements.filter((el) => selection.includes(el.id))
    if (picked.length) set({ clipboard: picked })
  },

  paste: () => {
    const copies = get().clipboard.map((el) => clone(el, 24, 24))
    if (copies.length === 0) return
    get().addElements(copies)
    // Paste again and the next copy steps further, instead of stacking exactly on top.
    set({ clipboard: copies })
  },

  reorder: (to) => {
    const targets = new Set(get().selection)
    if (targets.size === 0) return
    get().mutate((doc) => {
      const els = [...doc.elements]
      if (to === 'front' || to === 'back') {
        const picked = els.filter((el) => targets.has(el.id))
        const rest = els.filter((el) => !targets.has(el.id))
        return { ...doc, elements: to === 'front' ? [...rest, ...picked] : [...picked, ...rest] }
      }
      // Step each selected element past its neighbour, walking from the end we are moving towards.
      const order = to === 'forward' ? els.map((_, i) => els.length - 1 - i) : els.map((_, i) => i)
      const step = to === 'forward' ? 1 : -1
      for (const i of order) {
        const j = i + step
        if (targets.has(els[i].id) && j >= 0 && j < els.length && !targets.has(els[j].id)) {
          ;[els[i], els[j]] = [els[j], els[i]]
        }
      }
      return els.every((el, i) => el === doc.elements[i]) ? doc : { ...doc, elements: els }
    })
  },

  nudge: (dx, dy) => {
    const { selection, doc } = get()
    const movable = doc.elements.filter((el) => selection.includes(el.id) && !el.locked).map((el) => el.id)
    get().patchElements(movable, (el) => ({ x: el.x + dx, y: el.y + dy }), `nudge:${movable.join()}`)
  },

  rename: (name) => get().mutate((doc) => ({ ...doc, name }), 'rename'),

  undo: () => {
    const { past, future, doc } = get()
    if (past.length === 0) return
    lastKey = undefined
    const previous = past[past.length - 1]
    const ids = new Set(previous.elements.map((el) => el.id))
    set({
      doc: { ...previous, updatedAt: Date.now() },
      past: past.slice(0, -1),
      future: [doc, ...future],
      selection: get().selection.filter((id) => ids.has(id)),
      editingId: null,
    })
  },

  redo: () => {
    const { past, future, doc } = get()
    if (future.length === 0) return
    lastKey = undefined
    const next = future[0]
    const ids = new Set(next.elements.map((el) => el.id))
    set({
      doc: { ...next, updatedAt: Date.now() },
      past: [...past, doc],
      future: future.slice(1),
      selection: get().selection.filter((id) => ids.has(id)),
      editingId: null,
    })
  },

  select: (ids) => set({ selection: ids, editingId: null }),
  toggleSelect: (id) => {
    const { selection } = get()
    set({ selection: selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id], editingId: null })
  },
  setEditing: (id) => set({ editingId: id, selection: id ? [id] : get().selection }),
  setView: (view) => set(view),
  setSaveState: (saveState) => set({ saveState }),
}))

/** Where a newly added element of the given size should land: centred in the part the photo never covers. */
export function placement(width: number, height: number): { x: number; y: number } {
  const left = 600
  return {
    x: Math.round(left + (BANNER.width - left - 64 - width) / 2),
    y: Math.round((BANNER.height - height) / 2),
  }
}

export function selectedElements(state: Pick<EditorState, 'doc' | 'selection'>): BannerElement[] {
  return state.doc.elements.filter((el) => state.selection.includes(el.id))
}
