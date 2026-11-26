/**
 * Reads the public link-preview metadata of a LinkedIn profile page.
 *
 * LinkedIn has no public API for this, so this is best effort: it asks for the
 * public profile page the way a link unfurler would and reads the metadata the
 * page publishes about itself. LinkedIn often refuses (login wall, HTTP 999),
 * and callers must treat every failure as "ask the person instead".
 */

export interface LinkedInProfile {
  handle: string
  name: string
  headline: string
  location?: string
  /** data: URL, so the client can keep it after LinkedIn's signed CDN URL expires. */
  avatar?: string
}

export type ProfileFailure = 'invalid' | 'not_found' | 'blocked' | 'unreadable' | 'network'

export class ProfileError extends Error {
  constructor(public reason: ProfileFailure) {
    super(reason)
  }
}

const HANDLE = /^[\p{L}\p{N}_-]{3,100}$/u

/** Accepts a profile URL, `in/handle`, `@handle` or a bare handle. */
export function parseLinkedInHandle(input: string): string | null {
  let value = input.trim()
  if (!value) return null
  const match = value.match(/linkedin\.com\/(?:[a-z]{2,3}\/)?in\/([^/?#\s]+)/i)
  if (match) {
    value = match[1]
  } else if (/[/\s.]|:/.test(value.replace(/^@/, '').replace(/^in\//i, ''))) {
    // Some other URL or free text: not a profile reference.
    return null
  } else {
    value = value.replace(/^@/, '').replace(/^in\//i, '')
  }
  try {
    value = decodeURIComponent(value)
  } catch {
    return null
  }
  return HANDLE.test(value) ? value : null
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
}

function meta(html: string, property: string): string | undefined {
  const tag = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`, 'i'),
  )?.[0]
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1]
  return content ? decodeEntities(content).trim() : undefined
}

function clean(text: string | undefined): string {
  return decodeEntities((text ?? '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

interface JsonLdPerson {
  name?: string
  jobTitle?: string | string[]
  image?: string | { contentUrl?: string }
  address?: { addressLocality?: string }
  worksFor?: { name?: string }[]
}

function findPerson(html: string): JsonLdPerson | undefined {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1])
      const nodes: unknown[] = Array.isArray(data?.['@graph']) ? data['@graph'] : [data]
      const person = nodes.find(
        (node): node is JsonLdPerson =>
          typeof node === 'object' && node !== null && (node as { '@type'?: string })['@type'] === 'Person',
      )
      if (person) return person
    } catch {
      // Malformed JSON-LD: fall through to the meta tags.
    }
  }
  return undefined
}

/** Pulls name / headline / photo URL out of a public profile page. Exported for tests. */
export function parseProfileHtml(html: string): { name: string; headline: string; location?: string; imageUrl?: string } {
  const person = findPerson(html)
  // "Ada Lovelace - Analyst at Babbage & Co | LinkedIn"
  const title = (meta(html, 'og:title') ?? clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]))
    .replace(/\s*\|\s*LinkedIn\s*$/i, '')
  const dash = title.indexOf(' - ')
  const titleName = dash === -1 ? title : title.slice(0, dash)
  const titleRest = dash === -1 ? '' : title.slice(dash + 3)

  const name = clean(person?.name) || titleName.trim()
  if (!name || /^(sign in|sign up|linkedin|join linkedin)/i.test(name)) throw new ProfileError('blocked')

  const headlineTag = html.match(/<h2[^>]+class=["'][^"']*top-card-layout__headline[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1]
  const jobTitle = Array.isArray(person?.jobTitle) ? person.jobTitle.find(Boolean) : person?.jobTitle
  const company = person?.worksFor?.find((org) => org?.name)?.name
  const fromJsonLd = jobTitle ? (company ? `${jobTitle} at ${company}` : jobTitle) : ''
  const headline = clean(headlineTag) || clean(fromJsonLd) || titleRest.trim()

  const image = typeof person?.image === 'string' ? person.image : person?.image?.contentUrl
  const imageUrl = image || meta(html, 'og:image')
  const location = clean(person?.address?.addressLocality) || undefined

  return { name, headline, location, imageUrl }
}

const MAX_IMAGE_BYTES = 2_000_000

function isLinkedInMedia(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && (hostname === 'licdn.com' || hostname.endsWith('.licdn.com'))
  } catch {
    return false
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

async function fetchAvatar(url: string, fetchImpl: typeof fetch): Promise<string | undefined> {
  // Only ever follow image URLs onto LinkedIn's own media CDN.
  if (!isLinkedInMedia(url)) return undefined
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(6000) })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.startsWith('image/')) return undefined
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return undefined
    return `data:${type.split(';')[0]};base64,${toBase64(bytes)}`
  } catch {
    return undefined
  }
}

export async function fetchLinkedInProfile(handle: string, fetchImpl: typeof fetch = fetch): Promise<LinkedInProfile> {
  if (!HANDLE.test(handle)) throw new ProfileError('invalid')

  let response: Response
  try {
    response = await fetchImpl(`https://www.linkedin.com/in/${encodeURIComponent(handle)}`, {
      headers: {
        // Identify honestly as a link-preview fetcher rather than posing as a browser.
        'User-Agent': 'Mozilla/5.0 (compatible; OpenbannerLinkPreview/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    throw new ProfileError('network')
  }

  if (response.status === 404) throw new ProfileError('not_found')
  if (!response.ok || /\/(authwall|login|signup|checkpoint)/.test(response.url)) throw new ProfileError('blocked')

  const html = await response.text()
  let parsed: ReturnType<typeof parseProfileHtml>
  try {
    parsed = parseProfileHtml(html)
  } catch (error) {
    throw error instanceof ProfileError ? error : new ProfileError('unreadable')
  }

  const avatar = parsed.imageUrl ? await fetchAvatar(parsed.imageUrl, fetchImpl) : undefined
  return { handle, name: parsed.name, headline: parsed.headline, location: parsed.location, avatar }
}
