import type { Profile } from './types'

export { parseLinkedInHandle } from '../../server/linkedin'

export type LookupResult =
  | { ok: true; profile: Profile }
  /** `unavailable`: this deployment has no lookup endpoint (for example a static host). */
  | { ok: false; reason: 'invalid' | 'not_found' | 'blocked' | 'unreadable' | 'network' | 'unavailable' }

/** Asks our own endpoint to read the profile's public preview. Never throws. */
export async function lookupProfile(handle: string): Promise<LookupResult> {
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.headers.get('content-type')?.includes('application/json')) return { ok: false, reason: 'unavailable' }
    const body = await response.json()
    if (body?.ok && body.profile?.name) return { ok: true, profile: body.profile }
    return { ok: false, reason: body?.reason ?? 'unreadable' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
