import { fetchLinkedInProfile, parseLinkedInHandle, ProfileError, type ProfileFailure } from './linkedin'

const STATUS: Record<ProfileFailure, number> = {
  invalid: 400,
  not_found: 404,
  blocked: 502,
  unreadable: 502,
  network: 504,
}

/** Responses are never cached: a profile lookup should leave nothing behind on any server or CDN. */
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/**
 * POST /api/profile with a JSON body of `{ "handle": "<url-or-handle>" }`.
 *
 * POST rather than GET so the handle is not written into URLs, and therefore
 * not into access logs or browser history. Nothing is stored here either.
 */
export async function handleProfileRequest(request: Request, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, reason: 'invalid' satisfies ProfileFailure }, 405)
  let input: unknown
  try {
    input = (await request.json())?.handle
  } catch {
    input = undefined
  }
  const handle = typeof input === 'string' ? parseLinkedInHandle(input) : null
  if (!handle) return json({ ok: false, reason: 'invalid' satisfies ProfileFailure }, STATUS.invalid)
  try {
    const profile = await fetchLinkedInProfile(handle, fetchImpl)
    return json({ ok: true, profile }, 200)
  } catch (error) {
    const reason: ProfileFailure = error instanceof ProfileError ? error.reason : 'unreadable'
    return json({ ok: false, reason }, STATUS[reason])
  }
}
