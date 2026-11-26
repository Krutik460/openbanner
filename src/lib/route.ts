/**
 * The app's three addresses. The landing page and the templates page live at
 * `/` and `/templates`; the editor lives at `/edit`, so browser Back leaves
 * the editor for the page the visitor came from.
 */
export type Route = 'home' | 'templates' | 'editor'

const PATHS: Record<Route, string> = { home: '/', templates: '/templates', editor: '/edit' }

export function routeOf(path: string = location.pathname): Route {
  const clean = path.replace(/\/+$/, '') || '/'
  if (clean === PATHS.templates) return 'templates'
  if (clean === PATHS.editor) return 'editor'
  return 'home'
}

export function pathOf(route: Route): string {
  return PATHS[route]
}

/** Puts `route` in the address bar. Does nothing if it is already there, so repeated clicks don't pile up Back steps. */
export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}): void {
  if (routeOf() === route) return
  if (replace) history.replaceState(null, '', PATHS[route])
  else history.pushState(null, '', PATHS[route])
}

/** True for clicks that should keep the browser's own link behaviour (new tab, new window, download). */
export function isModifiedClick(e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number }): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0
}
