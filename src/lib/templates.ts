import { BANNER } from './constants'
import { makeIcon, makeShape, makeText, measureTextHeight, measureTextWidth } from './factory'
import { GRADIENTS, MESHES } from './presets'
import type { Background, BannerDoc, BannerElement, Profile, TextElement } from './types'
import { uid } from './util'

/**
 * Templates are functions of the profile, so every thumbnail and every new
 * design already carries the person's own name and headline.
 *
 * Layout rule shared by all of them: the profile photo covers the bottom-left
 * of the banner, so content lives in the right ~60% (x >= 590).
 */

const F = {
  geist: 'Geist Variable',
  bricolage: 'Bricolage Grotesque Variable',
  grotesk: 'Space Grotesk Variable',
  sora: 'Sora Variable',
  jakarta: 'Plus Jakarta Sans Variable',
  outfit: 'Outfit Variable',
  archivo: 'Archivo Variable',
  syne: 'Syne Variable',
  instrument: 'Instrument Serif',
  playfair: 'Playfair Display Variable',
  fraunces: 'Fraunces Variable',
  mono: 'JetBrains Mono Variable',
  bebas: 'Bebas Neue',
}

/** Faces the templates use, preloaded so text is measured with the real fonts. */
export const TEMPLATE_FONTS = [
  { family: F.geist, weight: 500 },
  { family: F.bricolage, weight: 700 },
  { family: F.grotesk, weight: 700 },
  { family: F.sora, weight: 700 },
  { family: F.jakarta, weight: 800 },
  { family: F.outfit, weight: 700 },
  { family: F.archivo, weight: 800 },
  { family: F.syne, weight: 800 },
  { family: F.instrument, weight: 400 },
  { family: F.instrument, weight: 400, italic: true },
  { family: F.playfair, weight: 600 },
  { family: F.fraunces, weight: 500 },
  { family: F.mono, weight: 500 },
  { family: F.bebas, weight: 400 },
]

interface Persona {
  name: string
  firstName: string
  /** The first clause of the headline: the one-line pitch. */
  tagline: string
  /** Remaining clauses of the headline. */
  tags: string[]
  company?: string
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

export function personaOf(profile: Profile | null | undefined): Persona {
  const name = profile?.name.trim() || 'Your Name'
  const parts = (profile?.headline ?? '')
    .split(/\s*[|•·]\s*|\s+[-–—]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const tagline = truncate(parts[0] ?? 'What you do, in one line', 72)
  const tags = parts.length > 1 ? parts.slice(1, 4).map((t) => truncate(t, 28)) : profile?.headline ? [] : ['Your focus', 'Your craft']
  const company = tagline.match(/(?:\bat\b|@)\s*(.+)$/i)?.[1]?.trim()
  return { name, firstName: name.split(/\s+/)[0], tagline, tags, company }
}

/** Picks a font size from [maxChars, size] steps so long headlines still fit. */
function fit(text: string, steps: [number, number][]): number {
  return (steps.find(([max]) => text.length <= max) ?? steps[steps.length - 1])[1]
}

/**
 * Narrows a wrapped text box to the tightest width that keeps the same number
 * of lines, so "a long headline that wraps / Co" becomes two even lines.
 * The box stays anchored on the side (or centre) the text is aligned to.
 */
function balance(el: TextElement): TextElement {
  if (el.height <= el.fontSize * el.lineHeight * 1.5) return el // single line
  let low = el.width / 2
  let high = el.width
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2
    if (measureTextHeight({ ...el, width: mid }) > el.height + 1) low = mid
    else high = mid
  }
  const width = Math.ceil(high) + 2
  const slack = el.width - width
  return { ...el, width, x: el.x + (el.align === 'right' ? slack : el.align === 'center' ? slack / 2 : 0) }
}

const CONTENT_X = 600
const CONTENT_W = 920
const MID = BANNER.height / 2

type StackItem =
  | { el: TextElement; gap?: number }
  | { height: number; gap?: number; build: (y: number) => BannerElement[] }

/** Lays items out top to bottom, vertically centred on `centerY`. */
function vstack(items: StackItem[], centerY = MID): BannerElement[] {
  const heightOf = (item: StackItem) => ('el' in item ? item.el.height : item.height)
  const total = items.reduce((sum, item, i) => sum + heightOf(item) + (i < items.length - 1 ? (item.gap ?? 16) : 0), 0)
  let y = Math.round(centerY - total / 2)
  const out: BannerElement[] = []
  for (const item of items) {
    if ('el' in item) out.push({ ...item.el, y })
    else out.push(...item.build(y))
    y += heightOf(item) + (item.gap ?? 16)
  }
  return out
}

interface PillStyle {
  font: string
  size: number
  weight: number
  color: string
  fill: string | null
  stroke?: string
  padX?: number
  height?: number
  gap?: number
  uppercase?: boolean
  letterSpacing?: number
}

/** A row of rounded labels starting at x; right-aligned when `rightEdge` is given. */
function pills(labels: string[], x: number, style: PillStyle, rightEdge?: number): StackItem | null {
  if (labels.length === 0) return null
  const { padX = 18, height = 40, gap = 10, letterSpacing = 0, uppercase = false } = style
  const text = { fontFamily: style.font, fontSize: style.size, fontWeight: style.weight, italic: false, letterSpacing, uppercase }
  const widths = labels.map((label) => Math.ceil(measureTextWidth({ ...text, text: label })) + padX * 2)
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1)
  const start = rightEdge === undefined ? x : rightEdge - total
  return {
    height,
    build: (y) => {
      let cursor = start
      return labels.flatMap((label, i) => {
        const pill = makeShape({
          shape: 'rect', name: 'Tag', x: cursor, y, width: widths[i], height, radius: height / 2,
          fill: style.fill, stroke: style.stroke ?? null, strokeWidth: style.stroke ? 1.5 : 0,
        })
        const el = makeText({
          ...text, text: label, name: label, fill: style.color, align: 'center', lineHeight: 1,
          x: cursor, width: widths[i], y: y + (height - style.size) / 2,
        })
        cursor += widths[i] + gap
        return [pill, el]
      })
    },
  }
}

const present = <T,>(items: (T | null | false | undefined)[]): T[] => items.filter(Boolean) as T[]

export interface Template {
  id: string
  name: string
  build: (persona: Persona) => { background: Background; elements: BannerElement[] }
}

export const TEMPLATES: Template[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    build: (p) => ({
      background: { fill: MESHES[0], pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.1, size: 1 } },
      elements: vstack(
        present([
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: CONTENT_W, fontSize: 19, fontWeight: 600, letterSpacing: 4, uppercase: true, fill: '#A5C8FF' }), gap: 18 },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: CONTENT_W, fontFamily: F.bricolage, fontSize: fit(p.tagline, [[24, 76], [40, 62], [60, 50], [99, 42]]), fontWeight: 700, lineHeight: 1.06, letterSpacing: -1 })), gap: 28 },
          pills(p.tags, CONTENT_X, { font: F.geist, size: 17, weight: 500, color: '#FFFFFF', fill: 'rgba(255, 255, 255, 0.12)', stroke: 'rgba(255, 255, 255, 0.24)' }),
        ]),
      ),
    }),
  },
  {
    id: 'editorial',
    name: 'Editorial',
    build: (p) => ({
      background: { fill: '#F2EDE3', pattern: { kind: 'noise', color: '#000000', opacity: 0.07, size: 1 } },
      elements: [
        makeShape({ shape: 'ellipse', name: 'Dot', x: 1492, y: 44, width: 28, height: 28, fill: '#E5484D' }),
        makeText({ text: p.name, name: 'Name', x: CONTENT_X, y: 48, width: 700, fontSize: 18, fontWeight: 600, letterSpacing: 3.5, uppercase: true, fill: '#1C1917' }),
        makeShape({ shape: 'rect', name: 'Rule', x: CONTENT_X, y: 88, width: CONTENT_W, height: 2, fill: '#1C1917' }),
        ...vstack(
          present([
            { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: CONTENT_W, fontFamily: F.instrument, italic: true, fontWeight: 400, fontSize: fit(p.tagline, [[26, 96], [44, 76], [64, 60], [99, 50]]), lineHeight: 1.02, letterSpacing: -1, fill: '#1C1917' })), gap: 20 },
            p.tags.length > 0 && { el: makeText({ text: p.tags.join('   ·   '), name: 'Details', x: CONTENT_X, width: CONTENT_W, fontSize: 19, fontWeight: 500, fill: '#57534E' }) },
          ]),
          MID + 42,
        ),
      ],
    }),
  },
  {
    id: 'signal',
    name: 'Signal',
    build: (p) => ({
      background: { fill: '#0A0A0B', pattern: { kind: 'grid', color: '#FFFFFF', opacity: 0.07, size: 44 } },
      elements: [
        makeShape({ shape: 'ellipse', name: 'Glow', x: 1330, y: -170, width: 360, height: 360, fill: '#C8F24B' }),
        makeShape({ shape: 'ellipse', name: 'Ring', x: 1250, y: -250, width: 520, height: 520, fill: null, stroke: 'rgba(200, 242, 75, 0.35)', strokeWidth: 1.5 }),
        ...vstack([
          { el: makeText({ text: "● Hello, I'm", name: 'Eyebrow', x: CONTENT_X, width: 600, fontFamily: F.mono, fontSize: 18, fontWeight: 500, letterSpacing: 2, uppercase: true, fill: '#C8F24B' }), gap: 14 },
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: 760, fontFamily: F.grotesk, fontSize: fit(p.name, [[12, 96], [18, 80], [26, 62], [99, 48]]), fontWeight: 700, lineHeight: 1, letterSpacing: -2.5 }), gap: 18 },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 720, fontFamily: F.grotesk, fontSize: 26, fontWeight: 400, lineHeight: 1.25, fill: '#A1A1AA' })) },
        ]),
      ],
    }),
  },
  {
    id: 'sunset',
    name: 'Sunset',
    build: (p) => ({
      background: { fill: GRADIENTS[0], pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.12, size: 1 } },
      elements: [
        makeShape({ shape: 'ellipse', name: 'Ring', x: 1180, y: -180, width: 560, height: 560, fill: null, stroke: 'rgba(255, 255, 255, 0.28)', strokeWidth: 2 }),
        makeShape({ shape: 'ellipse', name: 'Ring', x: 1290, y: -70, width: 340, height: 340, fill: 'rgba(255, 255, 255, 0.1)', stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 }),
        ...vstack([
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 780, fontFamily: F.sora, fontSize: fit(p.tagline, [[22, 68], [38, 56], [58, 46], [99, 38]]), fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 })), gap: 22 },
          { el: makeText({ text: `— ${p.name}`, name: 'Name', x: CONTENT_X, width: 780, fontFamily: F.sora, fontSize: 22, fontWeight: 500, fill: 'rgba(255, 255, 255, 0.88)' }) },
        ]),
      ],
    }),
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    build: (p) => ({
      background: { fill: GRADIENTS[1], pattern: { kind: 'dots', color: '#FFFFFF', opacity: 0.14, size: 26 } },
      elements: [
        makeShape({ shape: 'quarter', name: 'Corner', x: 1284, y: 96, width: 300, height: 300, fill: 'rgba(255, 255, 255, 0.08)' }),
        makeShape({ shape: 'ellipse', name: 'Ring', x: 1368, y: -92, width: 260, height: 260, fill: null, stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 2 }),
        ...vstack([
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: 760, fontFamily: F.jakarta, fontSize: fit(p.name, [[14, 72], [22, 60], [99, 48]]), fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }), gap: 12 },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 720, fontFamily: F.jakarta, fontSize: 25, fontWeight: 400, lineHeight: 1.3, fill: 'rgba(255, 255, 255, 0.86)' })), gap: 30 },
          {
            height: 28,
            build: (y) => [
              makeIcon({ icon: 'Mail', x: CONTENT_X, y, width: 28, height: 28, color: '#9CC7FF', strokeWidth: 2 }),
              makeText({ text: 'you@email.com', name: 'Email', x: CONTENT_X + 40, y: y + 3, width: 230, fontFamily: F.jakarta, fontSize: 19, fontWeight: 500, lineHeight: 1.15 }),
              makeIcon({ icon: 'Globe', x: CONTENT_X + 290, y, width: 28, height: 28, color: '#9CC7FF', strokeWidth: 2 }),
              makeText({ text: 'yourwebsite.com', name: 'Website', x: CONTENT_X + 330, y: y + 3, width: 260, fontFamily: F.jakarta, fontSize: 19, fontWeight: 500, lineHeight: 1.15 }),
            ],
          },
        ]),
      ],
    }),
  },
  {
    id: 'frame',
    name: 'Frame',
    build: (p) => ({
      background: { fill: '#FAFAF7' },
      elements: [
        makeShape({ shape: 'rect', name: 'Frame', x: 22, y: 22, width: BANNER.width - 44, height: BANNER.height - 44, fill: null, stroke: '#1C1917', strokeWidth: 1.5 }),
        ...vstack([
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: CONTENT_W, align: 'center', fontFamily: F.playfair, fontSize: fit(p.name, [[14, 84], [22, 68], [99, 52]]), fontWeight: 600, lineHeight: 1.05, letterSpacing: -1, fill: '#1C1917' }), gap: 22 },
          { height: 12, gap: 22, build: (y) => [makeShape({ shape: 'diamond', name: 'Ornament', x: CONTENT_X + CONTENT_W / 2 - 6, y, width: 12, height: 12, fill: '#B45309' })] },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X + 60, width: CONTENT_W - 120, align: 'center', fontSize: 19, fontWeight: 500, letterSpacing: 3, uppercase: true, lineHeight: 1.5, fill: '#57534E' })) },
        ]),
      ],
    }),
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    build: (p) => ({
      background: { fill: '#F4EFE6' },
      elements: [
        makeShape({ shape: 'rect', name: 'Block', x: 1188, y: 0, width: 198, height: 198, fill: '#1F3A93' }),
        makeShape({ shape: 'ellipse', name: 'Circle', x: 1386, y: 0, width: 198, height: 198, fill: '#E4572E' }),
        makeShape({ shape: 'quarter', name: 'Quarter', x: 1188, y: 198, width: 198, height: 198, fill: '#F2C14E' }),
        makeShape({ shape: 'rect', name: 'Block', x: 1386, y: 198, width: 198, height: 198, fill: '#111111' }),
        makeShape({ shape: 'triangle', name: 'Triangle', x: 1425, y: 240, width: 120, height: 114, fill: '#F4EFE6' }),
        ...vstack([
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 540, fontFamily: F.archivo, fontSize: fit(p.tagline, [[18, 64], [34, 52], [54, 42], [99, 34]]), fontWeight: 800, lineHeight: 1.02, letterSpacing: -1, uppercase: true, fill: '#111111' })), gap: 20 },
          { height: 4, gap: 18, build: (y) => [makeShape({ shape: 'rect', name: 'Rule', x: CONTENT_X, y, width: 72, height: 4, fill: '#E4572E' })] },
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: 540, fontFamily: F.archivo, fontSize: 22, fontWeight: 500, fill: '#111111' }) },
        ]),
      ],
    }),
  },
  {
    id: 'terminal',
    name: 'Terminal',
    build: (p) => {
      const line = (text: string, y: number, fill: string) =>
        makeText({ text, x: 632, y, width: 860, fontFamily: F.mono, fontSize: 22, fontWeight: 500, lineHeight: 1.2, fill })
      return {
        background: { fill: MESHES[5] },
        elements: [
          makeShape({ shape: 'rect', name: 'Window', x: CONTENT_X, y: 46, width: CONTENT_W, height: 304, radius: 16, fill: 'rgba(13, 17, 23, 0.86)', stroke: 'rgba(255, 255, 255, 0.14)', strokeWidth: 1.5 }),
          makeShape({ shape: 'ellipse', name: 'Close', x: 628, y: 70, width: 14, height: 14, fill: '#FF5F57' }),
          makeShape({ shape: 'ellipse', name: 'Minimise', x: 652, y: 70, width: 14, height: 14, fill: '#FEBC2E' }),
          makeShape({ shape: 'ellipse', name: 'Zoom', x: 676, y: 70, width: 14, height: 14, fill: '#28C840' }),
          line('$ whoami', 118, '#3FB950'),
          line(p.name.toLowerCase(), 152, '#E6EDF3'),
          line('$ cat focus.txt', 206, '#3FB950'),
          line(truncate(p.tagline.toLowerCase(), 58), 240, '#E6EDF3'),
          line(p.tags.length ? `# ${truncate(p.tags.join(' · ').toLowerCase(), 56)}` : '# open to interesting problems', 294, '#8B949E'),
        ],
      }
    },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    build: (p) => ({
      background: { fill: MESHES[1], pattern: { kind: 'noise', color: '#000000', opacity: 0.06, size: 1 } },
      elements: vstack(
        present([
          { ...pills([`Hi, I'm ${p.firstName}`], CONTENT_X, { font: F.outfit, size: 19, weight: 600, color: '#1F1147', fill: '#FFFFFF', height: 44, padX: 20 })!, gap: 22 },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 860, fontFamily: F.outfit, fontSize: fit(p.tagline, [[22, 74], [38, 60], [58, 48], [99, 40]]), fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.5, fill: '#1F1147' })), gap: 20 },
          p.tags.length > 0 && { el: makeText({ text: p.tags.join('  •  '), name: 'Details', x: CONTENT_X, width: 860, fontFamily: F.outfit, fontSize: 21, fontWeight: 500, fill: '#4C3D7A' }) },
        ]),
      ),
    }),
  },
  {
    id: 'forest',
    name: 'Forest',
    build: (p) => ({
      background: { fill: GRADIENTS[2], pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.08, size: 1 } },
      elements: [
        makeShape({ shape: 'arch', name: 'Arch', x: 1320, y: 76, width: 200, height: 320, fill: null, stroke: '#D9B66F', strokeWidth: 1.5 }),
        makeShape({ shape: 'arch', name: 'Arch', x: 1352, y: 124, width: 136, height: 272, fill: 'rgba(217, 182, 111, 0.14)', stroke: '#D9B66F', strokeWidth: 1.5 }),
        makeShape({ shape: 'ellipse', name: 'Sun', x: 1396, y: 172, width: 48, height: 48, fill: '#D9B66F' }),
        ...vstack([
          { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: 680, fontFamily: F.fraunces, fontSize: fit(p.name, [[14, 78], [22, 64], [99, 50]]), fontWeight: 500, lineHeight: 1.04, letterSpacing: -1, fill: '#F3EAD3' }), gap: 20 },
          { height: 2, gap: 20, build: (y) => [makeShape({ shape: 'rect', name: 'Rule', x: CONTENT_X, y, width: 64, height: 2, fill: '#D9B66F' })] },
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: 660, fontSize: 23, fontWeight: 400, lineHeight: 1.35, fill: '#D9B66F' })) },
        ]),
      ],
    }),
  },
  {
    id: 'hiring',
    name: 'Hiring',
    build: (p) => ({
      background: { fill: '#C8F24B' },
      elements: [
        makeShape({ shape: 'star', name: 'Star', x: 1404, y: 44, width: 120, height: 120, rotation: 12, fill: '#0A0A0B' }),
        makeText({ text: "We're hiring", name: 'Headline', x: CONTENT_X - 5, y: 70, width: 800, fontFamily: F.bebas, fontSize: 176, fontWeight: 400, lineHeight: 0.9, letterSpacing: 1, uppercase: true, fill: '#0A0A0B' }),
        makeShape({ shape: 'rect', name: 'Button', x: CONTENT_X, y: 262, width: 252, height: 60, radius: 30, fill: '#0A0A0B' }),
        makeText({ text: 'See open roles', name: 'Button label', x: CONTENT_X, y: 281, width: 212, align: 'center', fontSize: 21, fontWeight: 600, lineHeight: 1, fill: '#C8F24B' }),
        makeIcon({ icon: 'ArrowUpRight', x: CONTENT_X + 198, y: 278, width: 28, height: 28, color: '#C8F24B', strokeWidth: 2.25 }),
        makeText({ text: p.company ? `Come build with us at ${p.company}` : `Come build with ${p.firstName}'s team`, name: 'Subline', x: CONTENT_X + 276, y: 280, width: 620, fontSize: 22, fontWeight: 500, lineHeight: 1.1, fill: '#0A0A0B' }),
      ],
    }),
  },
  {
    id: 'noir',
    name: 'Noir',
    build: (p) => ({
      background: { fill: MESHES[7], pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.1, size: 1 } },
      elements: vstack([
        { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: CONTENT_W, align: 'right', fontFamily: F.instrument, fontWeight: 400, fontSize: fit(p.tagline, [[26, 100], [44, 80], [64, 62], [99, 52]]), lineHeight: 1, letterSpacing: -1 })), gap: 24 },
        { el: makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: CONTENT_W, align: 'right', fontSize: 18, fontWeight: 500, letterSpacing: 4, uppercase: true, fill: '#A1A1AA' }) },
      ]),
    }),
  },
]

export function instantiate(template: Template, profile: Profile | null | undefined): BannerDoc {
  const { background, elements } = template.build(personaOf(profile))
  return { id: uid(), name: template.name, background, elements, updatedAt: Date.now() }
}

export function blankDoc(): BannerDoc {
  return { id: uid(), name: 'Untitled banner', background: { fill: '#18181B' }, elements: [], updatedAt: Date.now() }
}
