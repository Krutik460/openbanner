import { describe, expect, it } from 'vitest'
import { handleProfileRequest } from './handler'
import { parseLinkedInHandle, parseProfileHtml } from './linkedin'

describe('parseLinkedInHandle', () => {
  it.each([
    ['https://www.linkedin.com/in/ada-lovelace/', 'ada-lovelace'],
    ['linkedin.com/in/ada-lovelace?trk=abc', 'ada-lovelace'],
    ['https://uk.linkedin.com/in/ada-lovelace-123a45', 'ada-lovelace-123a45'],
    ['in/ada-lovelace', 'ada-lovelace'],
    ['@ada-lovelace', 'ada-lovelace'],
    ['  ada-lovelace  ', 'ada-lovelace'],
    ['https://www.linkedin.com/in/jos%C3%A9-garc%C3%ADa', 'josé-garcía'],
  ])('reads %s', (input, handle) => {
    expect(parseLinkedInHandle(input)).toBe(handle)
  })

  it.each(['', 'ab', 'https://example.com/in/ada', 'https://www.linkedin.com/company/acme', 'ada lovelace', '../etc'])(
    'rejects %s',
    (input) => {
      expect(parseLinkedInHandle(input)).toBeNull()
    },
  )
})

const PAGE = `<html><head>
<title>Ada Lovelace - Babbage &amp; Co | LinkedIn</title>
<meta property="og:title" content="Ada Lovelace - Babbage &amp; Co | LinkedIn">
<meta property="og:image" content="https://media.licdn.com/dms/image/abc/photo.jpg?e=1&amp;v=beta">
<script type="application/ld+json">{"@context":"http://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Person","name":"Ada Lovelace","jobTitle":["Analyst"],"worksFor":[{"name":"Babbage & Co"}],"address":{"addressLocality":"London, UK"},"image":{"contentUrl":"https://media.licdn.com/dms/image/abc/ld.jpg"}}]}</script>
</head><body>
<h2 class="top-card-layout__headline break-words">
  Analyst &amp; first programmer | Speaker
</h2></body></html>`

describe('parseProfileHtml', () => {
  it('prefers the visible headline and JSON-LD details', () => {
    expect(parseProfileHtml(PAGE)).toEqual({
      name: 'Ada Lovelace',
      headline: 'Analyst & first programmer | Speaker',
      location: 'London, UK',
      imageUrl: 'https://media.licdn.com/dms/image/abc/ld.jpg',
    })
  })

  it('falls back to the page title and og:image', () => {
    const html = PAGE.replace(/<script[\s\S]*?<\/script>/, '').replace(/<h2[\s\S]*?<\/h2>/, '')
    expect(parseProfileHtml(html)).toEqual({
      name: 'Ada Lovelace',
      headline: 'Babbage & Co',
      location: undefined,
      imageUrl: 'https://media.licdn.com/dms/image/abc/photo.jpg?e=1&v=beta',
    })
  })

  it('treats a login wall as blocked', () => {
    expect(() => parseProfileHtml('<title>Sign Up | LinkedIn</title>')).toThrow('blocked')
  })
})

describe('handleProfileRequest', () => {
  const request = (handle: string) =>
    new Request('http://x/api/profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ handle }) })

  it('returns the profile with the photo inlined', async () => {
    const requested: string[] = []
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requested.push(url)
      if (url.includes('/in/')) {
        const response = new Response(PAGE, { status: 200, headers: { 'content-type': 'text/html' } })
        Object.defineProperty(response, 'url', { value: url })
        return response
      }
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    }) as typeof fetch

    const response = await handleProfileRequest(request('linkedin.com/in/ada-lovelace'), fetchImpl)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      ok: true,
      profile: {
        handle: 'ada-lovelace',
        name: 'Ada Lovelace',
        headline: 'Analyst & first programmer | Speaker',
        location: 'London, UK',
        avatar: 'data:image/jpeg;base64,AQID',
      },
    })
    expect(requested[0]).toBe('https://www.linkedin.com/in/ada-lovelace')
  })

  it('never fetches a photo from outside the LinkedIn CDN', async () => {
    const requested: string[] = []
    const fetchImpl = (async (input: RequestInfo | URL) => {
      requested.push(String(input))
      const page = PAGE.replaceAll('https://media.licdn.com', 'http://169.254.169.254')
      const response = new Response(page, { status: 200 })
      Object.defineProperty(response, 'url', { value: String(input) })
      return response
    }) as typeof fetch

    const body = await (await handleProfileRequest(request('ada-lovelace'), fetchImpl)).json()
    expect(body.profile.avatar).toBeUndefined()
    expect(requested).toHaveLength(1)
  })

  it('reports LinkedIn refusing the request', async () => {
    // LinkedIn's bot refusal is HTTP 999, which `new Response` cannot construct.
    const fetchImpl = (async () => ({ status: 999, ok: false, url: '' })) as unknown as typeof fetch
    const response = await handleProfileRequest(request('ada-lovelace'), fetchImpl)
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ ok: false, reason: 'blocked' })
  })

  it('refuses GET, so handles never travel in URLs', async () => {
    const response = await handleProfileRequest(new Request('http://x/api/profile?handle=ada-lovelace'))
    expect(response.status).toBe(405)
  })

  it('rejects anything that is not a profile handle without fetching', async () => {
    const fetchImpl = (async () => {
      throw new Error('should not fetch')
    }) as typeof fetch
    const response = await handleProfileRequest(request('https://evil.example/in/x'), fetchImpl)
    expect(response.status).toBe(400)
  })
})
