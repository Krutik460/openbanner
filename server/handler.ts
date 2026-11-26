import { fetchLinkedInProfile, parseLinkedInHandle, ProfileError, type ProfileFailure } from './linkedin'

const STATUS: Record<ProfileFailure, number> = {
  invalid: 400,
  not_found: 404,
  blocked: 502,
  unreadable: 502,
  network: 504,
}

function json(body: unknown, status: number, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  })
}

/** GET /api/profile?handle=<url-or-handle> */
export async function handleProfileRequest(request: Request, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const handle = parseLinkedInHandle(new URL(request.url).searchParams.get('handle') ?? '')
  if (!handle) return json({ ok: false, reason: 'invalid' satisfies ProfileFailure }, STATUS.invalid)
  try {
    const profile = await fetchLinkedInProfile(handle, fetchImpl)
    return json({ ok: true, profile }, 200, 'public, max-age=300, s-maxage=3600')
  } catch (error) {
    const reason: ProfileFailure = error instanceof ProfileError ? error.reason : 'unreadable'
    return json({ ok: false, reason }, STATUS[reason])
  }
}
