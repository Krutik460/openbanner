import { navigate, routeOf } from '@/lib/route'
import * as storage from '@/lib/storage'
import type { BannerDoc, Profile } from '@/lib/types'
import { debounce } from '@/lib/util'
import { useEditor } from './editor'

/**
 * Loads what this browser remembers and decides where the person lands.
 * Someone with a saved design opening the site goes straight back to it;
 * /templates always shows the templates page.
 */
export async function restore(): Promise<void> {
  const editor = useEditor.getState()
  const route = routeOf()
  let doc: BannerDoc | undefined
  try {
    const [profile, designs] = await Promise.all([storage.loadProfile(), storage.listDesigns()])
    if (profile) editor.setProfile(profile)
    const wanted = storage.getCurrentDesignId()
    const id = designs.find((d) => d.id === wanted)?.id ?? designs[0]?.id
    doc = id ? await storage.loadDesign(id) : undefined
  } catch {
    // Storage unavailable (private mode, blocked): the app still works, it just will not remember.
  }
  if (doc) editor.openDoc(doc)
  if (doc && route !== 'templates') {
    navigate('editor', { replace: true })
    editor.setScreen('editor')
  } else {
    if (route === 'editor') navigate('home', { replace: true })
    editor.setScreen('welcome')
  }
}

/** Keeps the screen in step with the address bar when the visitor uses Back and Forward. */
export function followHistory(): () => void {
  const onPop = () => useEditor.getState().setScreen(routeOf() === 'editor' ? 'editor' : 'welcome')
  window.addEventListener('popstate', onPop)
  return () => window.removeEventListener('popstate', onPop)
}

const persist = debounce((doc: BannerDoc) => {
  storage
    .saveDesign(doc)
    .then(() => {
      // Only report "saved" if nothing changed while we were writing.
      if (useEditor.getState().doc === doc) useEditor.getState().setSaveState('saved')
    })
    .catch(() => useEditor.getState().setSaveState('error'))
}, 500)

/** Saves the open design whenever it changes. Returns an unsubscribe function. */
export function startAutosave(): () => void {
  return useEditor.subscribe((state, previous) => {
    if (state.screen !== 'editor') return
    if (state.doc !== previous.doc || state.screen !== previous.screen) {
      storage.setCurrentDesignId(state.doc.id)
      if (state.saveState !== 'saving') state.setSaveState('saving')
      persist(state.doc)
    }
  })
}

export function rememberProfile(profile: Profile): void {
  useEditor.getState().setProfile(profile)
  storage.saveProfile(profile).catch(() => {})
}

/** Opens a design in the editor (new or existing) and makes it the current one. */
export function openInEditor(doc: BannerDoc): void {
  const editor = useEditor.getState()
  editor.openDoc(doc)
  navigate('editor')
  editor.setScreen('editor')
}

/** Leaves the editor for the landing page. The design stays loaded and saved. */
export function goHome(): void {
  navigate('home')
  useEditor.getState().setScreen('welcome')
}

/** Back to the design that is already loaded. */
export function resumeEditing(): void {
  navigate('editor')
  useEditor.getState().setScreen('editor')
}
