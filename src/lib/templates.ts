import { BANNER } from './constants'
import { makeIcon, makeShape, makeText, measureTextHeight, measureTextWidth } from './factory'
import { GRADIENTS, linear, mesh, MESHES } from './presets'
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
  cormorant: 'Cormorant Garamond Variable',
  script: 'Ms Madi',
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
  { family: F.cormorant, weight: 500 },
  { family: F.cormorant, weight: 500, italic: true },
  { family: F.script, weight: 400 },
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
  const given = profile?.name.trim()
  const name = given || 'Your Name'
  const parts = (profile?.headline ?? '')
    .split(/\s*[|•·]\s*|\s+[-–—]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const tagline = truncate(parts[0] ?? 'What you do, in one line', 72)
  const tags = parts.length > 1 ? parts.slice(1, 4).map((t) => truncate(t, 28)) : profile?.headline ? [] : ['Your focus', 'Your craft']
  const company = tagline.match(/(?:\bat\b|@)\s*(.+)$/i)?.[1]?.trim()
  // Without a name, "Hi, I'm Your" would read wrong: the placeholder stays whole.
  return { name, firstName: given ? given.split(/\s+/)[0] : name, tagline, tags, company }
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

interface Face {
  fontFamily: string
  fontWeight: number
  italic?: boolean
  uppercase?: boolean
  /** Letter spacing as a fraction of the font size. */
  tracking?: number
}

/** The largest size up to `max` (and no smaller than `min`) at which each line fits on one line in `width`. */
function fitSize(lines: string[], face: Face, width: number, max: number, min = 1): number {
  const widest = Math.max(
    ...lines.map((text) =>
      measureTextWidth({ ...face, text, italic: face.italic ?? false, uppercase: face.uppercase ?? false, fontSize: max, letterSpacing: (face.tracking ?? 0) * max }),
    ),
  )
  return Math.max(min, Math.min(max, Math.floor((max * width) / widest)))
}

/**
 * Konva leaves letter spacing after the last character too, which pushes
 * tracked right-aligned or centred text off its edge. This nudges it back.
 */
function tracked(el: TextElement): TextElement {
  const shift = el.align === 'right' ? el.letterSpacing : el.align === 'center' ? el.letterSpacing / 2 : 0
  return shift ? { ...el, x: el.x + shift } : el
}

/** Font props for a face at a given size, with its tracking turned into pixels. */
function sized(face: Face, fontSize: number) {
  const { fontFamily, fontWeight, italic = false, uppercase = false, tracking = 0 } = face
  return { fontFamily, fontWeight, italic, uppercase, fontSize, letterSpacing: Math.round(tracking * fontSize * 10) / 10 }
}

/** Splits a name into a first line and the rest, for names set large on two lines. */
function nameLines(name: string): string[] {
  const [first, ...rest] = name.split(/\s+/)
  return rest.length ? [first, rest.join(' ')] : [first]
}

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

interface RowStyle {
  font: string
  size: number
  weight: number
  color: string
  letterSpacing?: number
  uppercase?: boolean
  /** Space on either side of each separator. */
  gap: number
  separator: (x: number, y: number) => BannerElement
  separatorWidth: number
}

/**
 * Text items in one line with a small mark between each, starting at x and
 * dropping trailing items that would run past `maxWidth`.
 */
function row(labels: string[], x: number, y: number, maxWidth: number, style: RowStyle): BannerElement[] {
  const { letterSpacing = 0, uppercase = false } = style
  const face = { fontFamily: style.font, fontSize: style.size, fontWeight: style.weight, italic: false, letterSpacing, uppercase }
  const out: BannerElement[] = []
  let cursor = x
  for (const [i, label] of labels.entries()) {
    const width = Math.ceil(measureTextWidth({ ...face, text: label }))
    const lead = i === 0 ? 0 : style.gap * 2 + style.separatorWidth
    if (cursor + lead + width - letterSpacing > x + maxWidth) break
    if (i > 0) out.push(style.separator(cursor + style.gap, y + style.size / 2))
    cursor += lead
    out.push(makeText({ ...face, text: label, name: label, x: cursor, y, width: width + 2, fill: style.color, lineHeight: 1 }))
    cursor += width
  }
  return out
}

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
  {
    id: 'glow',
    name: 'Glow',
    build: (p) => {
      const face: Face = { fontFamily: F.geist, fontWeight: 600, tracking: -0.05 }
      const x = 700
      const size = fitSize(nameLines(p.name), face, 700, 104, 52)
      return {
        background: {
          fill: mesh('#E9EAEE', [0.33, 0.6, 0.27, '#FFC46B'], [0.35, 0.72, 0.17, '#FF7A1F'], [0.37, 0.86, 0.1, '#FF4A1C']),
          pattern: { kind: 'noise', color: '#000000', opacity: 0.07, size: 1 },
        },
        elements: [
          makeShape({ shape: 'ellipse', name: 'Button', x: 1460, y: 44, width: 60, height: 60, fill: '#111111' }),
          makeIcon({ icon: 'ArrowUpRight', x: 1476, y: 60, width: 28, height: 28, color: '#FFFFFF', strokeWidth: 2 }),
          ...vstack(
            present([
              { el: makeText({ text: nameLines(p.name).join('\n'), name: 'Name', x: x - size * 0.04, width: 740, ...sized(face, size), lineHeight: 0.92, fill: '#111111' }), gap: 22 },
              { el: balance(makeText({ text: p.tagline, name: 'Tagline', x, width: 620, fontFamily: F.geist, fontSize: 22, fontWeight: 500, lineHeight: 1.3, fill: '#3F3F46' })), gap: 22 },
              pills(p.tags, x, { font: F.geist, size: 16, weight: 500, color: '#111111', fill: null, stroke: '#111111', height: 36, padX: 16 }),
            ]),
          ),
        ],
      }
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    build: (p) => ({
      background: {
        fill: mesh('#040A22', [0.68, 0.45, 0.42, '#173A8C'], [0.98, 0.0, 0.3, '#1E3FA0'], [0.2, 1.05, 0.38, '#0A1A52']),
        pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.14, size: 1 },
      },
      elements: [
        makeShape({ shape: 'sparkle', name: 'Sparkle', x: 1490, y: 46, width: 30, height: 30, fill: '#C9D6FF' }),
        ...vstack([
        { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: 660, width: 800, align: 'center', fontFamily: F.cormorant, fontWeight: 500, fontSize: fit(p.tagline, [[24, 80], [40, 66], [60, 54], [99, 46]]), lineHeight: 1.02, letterSpacing: -0.5, fill: '#F4F6FF' })), gap: 26 },
        { el: tracked(makeText({ text: p.name, name: 'Name', x: 660, width: 800, align: 'center', fontSize: 14, fontWeight: 500, letterSpacing: 4, uppercase: true, fill: 'rgba(222, 230, 255, 0.72)' })) },
        ]),
      ],
    }),
  },
  {
    id: 'poster',
    name: 'Poster',
    build: (p) => {
      const face: Face = { fontFamily: F.archivo, fontWeight: 900, uppercase: true, tracking: -0.035 }
      const size = fitSize(nameLines(p.name), face, CONTENT_W, 156, 60)
      const name = makeText({ text: nameLines(p.name).join('\n'), name: 'Name', x: CONTENT_X - Math.round(size * 0.05), width: CONTENT_W + 60, ...sized(face, size), lineHeight: 0.86, fill: '#E5231B' })
      return {
        background: { fill: '#FFFFFF', pattern: { kind: 'noise', color: '#000000', opacity: 0.04, size: 1 } },
        elements: [
          { ...name, y: Math.round(28 + (272 - name.height) / 2) },
          makeShape({ shape: 'rect', name: 'Rule', x: CONTENT_X, y: 318, width: CONTENT_W, height: 2, fill: '#111111' }),
          ...row([p.tagline, ...p.tags, 'yourwebsite.com'], CONTENT_X, 338, CONTENT_W, {
            font: F.archivo, size: 14, weight: 700, color: '#111111', letterSpacing: 1.4, uppercase: true, gap: 16, separatorWidth: 9,
            separator: (x, y) => makeShape({ shape: 'star', name: 'Separator', x, y: y - 5, width: 10, height: 10, fill: '#E5231B' }),
          }),
        ],
      }
    },
  },
  {
    id: 'streak',
    name: 'Streak',
    build: (p) => ({
      background: {
        fill: {
          type: 'linear',
          angle: 90,
          stops: ([
            [0, '#0A1E4D'], [0.1, '#1A55B8'], [0.17, '#6BBDEB'], [0.205, '#D4F0F7'], [0.24, '#2A68C6'], [0.34, '#0D2A66'], [0.45, '#33307F'],
            [0.54, '#C2412D'], [0.62, '#F28A3A'], [0.66, '#F7B060'], [0.74, '#C8301F'], [0.86, '#E5532C'], [1, '#5A0F14'],
          ] as const).map(([offset, color]) => ({ offset, color })),
        },
        pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.12, size: 1 },
      },
      elements: vstack([
        { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: CONTENT_W, align: 'right', fontFamily: F.geist, fontWeight: 400, fontSize: fit(p.tagline, [[24, 66], [40, 56], [60, 46], [99, 40]]), lineHeight: 1.08, letterSpacing: -1.5, fill: '#FFFFFF' })), gap: 24 },
        { el: tracked(makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: CONTENT_W, align: 'right', fontSize: 14, fontWeight: 600, letterSpacing: 4, uppercase: true, fill: 'rgba(255, 255, 255, 0.86)' })) },
      ]),
    }),
  },
  {
    id: 'ribbon',
    name: 'Ribbon',
    build: (p) => {
      const face: Face = { fontFamily: F.cormorant, fontWeight: 500, uppercase: true, tracking: 0.16 }
      const size = fitSize([p.name], face, 640, 46, 26)
      const x = 820
      const width = BANNER.width - 64 - x
      return {
        background: { fill: linear(100, '#F5EDE9', '#ECDDD6'), pattern: { kind: 'noise', color: '#000000', opacity: 0.05, size: 1 } },
        elements: [
          makeShape({ shape: 'ribbon', name: 'Ribbon', x: -140, y: 270, width: 1260, height: 320, rotation: -22, fill: null, stroke: '#D29479', strokeWidth: 1 }),
          ...vstack(
            present([
              { el: tracked(makeText({ text: p.name, name: 'Name', x, width, align: 'right', ...sized(face, size), lineHeight: 1.1, fill: '#2F2622' })), gap: 10 },
              { el: tracked(balance(makeText({ text: p.tagline, name: 'Tagline', x, width, align: 'right', fontSize: 14, fontWeight: 600, letterSpacing: 3, uppercase: true, lineHeight: 1.5, fill: '#A0644B' }))), gap: 26 },
              { height: 1, gap: 24, build: (y) => [makeShape({ shape: 'rect', name: 'Rule', x: x + width - 80, y, width: 80, height: 1, fill: '#2F2622' })] },
              p.tags.length > 0 && { el: makeText({ text: p.tags.join('  ·  '), name: 'Details', x, width, align: 'right', fontFamily: F.cormorant, italic: true, fontWeight: 500, fontSize: 23, fill: '#5A4A43' }) },
            ]),
          ),
        ],
      }
    },
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    build: (p) => {
      const cx = 1060
      const side = (text: string | undefined, align: 'left' | 'right') =>
        text ? balance(makeText({ text, name: 'Detail', x: align === 'left' ? CONTENT_X : BANNER.width - 64 - 170, width: 170, align, fontSize: 12, fontWeight: 600, letterSpacing: 3, uppercase: true, lineHeight: 1.6, fill: '#9FC3A6' })) : null
      const left = side(p.tags[0], 'left')
      const right = side(p.tags[1], 'right')
      return {
        background: {
          fill: mesh('#05241A', [0.67, 0.5, 0.34, '#1E6A4C'], [0.05, 0.05, 0.3, '#0C3A2A'], [1.0, 1.05, 0.34, '#0A3123']),
          pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.1, size: 1 },
        },
        elements: [
          makeShape({ shape: 'ellipse', name: 'Ring', x: cx - 270, y: MID - 270, width: 540, height: 540, fill: null, stroke: 'rgba(214, 236, 214, 0.24)', strokeWidth: 1.5 }),
          makeShape({ shape: 'ellipse', name: 'Ring', x: cx - 232, y: MID - 232, width: 464, height: 464, fill: null, stroke: 'rgba(214, 236, 214, 0.12)', strokeWidth: 1 }),
          ...present([left && { ...left, y: Math.round(MID - left.height / 2) }, right && tracked({ ...right, y: Math.round(MID - right.height / 2) })]),
          ...vstack([
            { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: cx - 280, width: 560, align: 'center', fontFamily: F.instrument, fontWeight: 400, uppercase: true, fontSize: fit(p.tagline, [[18, 78], [32, 64], [52, 54], [99, 46]]), lineHeight: 0.96, fill: '#EEF5E6' })), gap: 24 },
            { el: tracked(makeText({ text: p.name, name: 'Name', x: cx - 280, width: 560, align: 'center', fontSize: 13, fontWeight: 600, letterSpacing: 4, uppercase: true, fill: '#9FC3A6' })) },
          ]),
        ],
      }
    },
  },
  {
    id: 'monogram',
    name: 'Monogram',
    build: (p) => {
      const [first, ...rest] = p.name.split(/\s+/)
      const last = rest.join(' ')
      const cx = 1060
      const ink = '#141414'
      const caps: Face = { fontFamily: F.cormorant, fontWeight: 500, uppercase: true, tracking: 0.3 }
      const mono = makeText({ text: initials(p.name), name: 'Monogram', x: 0, width: 400, align: 'center', fontFamily: F.script, fontWeight: 400, fontSize: 150, lineHeight: 1, fill: ink })
      const monoW = measureTextWidth(mono)
      const gap = 30
      const half = Math.floor((CONTENT_W - monoW) / 2 - gap)
      const size = fitSize(last ? [first, last] : [first], caps, half, 36, 18)
      const capsY = Math.round(MID - 24 - (size * 1.2) / 2)
      const tagline = tracked(balance(makeText({ text: p.tagline, name: 'Tagline', x: cx - 400, width: 800, align: 'center', fontSize: 13, fontWeight: 500, letterSpacing: 4, uppercase: true, lineHeight: 1.6, fill: '#707070' })))
      const capsText = (text: string, x: number, align: 'left' | 'right') =>
        tracked(makeText({ text, name: 'Name', x, y: capsY, width: half, align, ...sized(caps, size), lineHeight: 1.2, fill: ink }))
      return {
        background: { fill: '#FFFFFF' },
        elements: last
          ? [
              capsText(first, cx - monoW / 2 - gap - half, 'right'),
              { ...mono, x: cx - 200, y: Math.round(MID - 24 - 75 - 4) },
              capsText(last, cx + monoW / 2 + gap, 'left'),
              { ...tagline, y: 300 - Math.round(tagline.height / 2) },
            ]
          : vstack([
              { el: { ...mono, x: cx - 200 }, gap: 4 },
              { el: tracked(makeText({ text: first, name: 'Name', x: cx - 400, width: 800, align: 'center', ...sized(caps, size), lineHeight: 1.2, fill: ink })), gap: 22 },
              { el: tagline },
            ]),
      }
    },
  },
  {
    id: 'headline',
    name: 'Headline',
    build: (p) => ({
      background: {
        fill: mesh('#0A3BD8', [0.95, 0.05, 0.42, '#7CC0FF'], [0.25, 1.05, 0.5, '#04187A'], [0.62, 0.55, 0.22, '#2C6BFF']),
        pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.12, size: 1 },
      },
      elements: vstack(
        present([
          { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: 640, width: 840, align: 'center', fontFamily: F.bebas, fontWeight: 400, uppercase: true, fontSize: fit(p.tagline, [[20, 116], [36, 96], [56, 80], [99, 66]]), lineHeight: 0.9, letterSpacing: 0.5, fill: '#FFFFFF' })), gap: 16 },
          { el: tracked(makeText({ text: p.name, name: 'Name', x: 640, width: 840, align: 'center', fontSize: 17, fontWeight: 600, letterSpacing: 9, uppercase: true, fill: '#FFFFFF' })), gap: 26 },
          p.tags.length > 0 && { el: tracked(makeText({ text: p.tags.join('   ·   '), name: 'Details', x: 640, width: 840, align: 'center', fontSize: 14, fontWeight: 500, letterSpacing: 1.5, fill: 'rgba(255, 255, 255, 0.72)' })) },
        ]),
      ),
    }),
  },
  {
    id: 'signature',
    name: 'Signature',
    build: (p) => {
      const cream = '#F1EAD6'
      const face: Face = { fontFamily: F.script, fontWeight: 400 }
      const size = fitSize([p.name], face, 720, 136, 72)
      const tagline = tracked(balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X + 200, width: CONTENT_W - 200, align: 'right', fontSize: 13, fontWeight: 500, letterSpacing: 4, uppercase: true, lineHeight: 1.6, fill: 'rgba(241, 234, 214, 0.78)' })))
      // The signature sits on its line; its descenders hang below, so the tagline keeps clear of them.
      const baseline = size * 0.74
      const below = Math.max(26, size * 0.34)
      const nameY = Math.round(MID - (baseline + below + tagline.height) / 2 - 6)
      const lineY = Math.round(nameY + baseline)
      return {
        background: {
          fill: mesh('#3D4B33', [0.7, 0.4, 0.42, '#56673F'], [0.08, 1.0, 0.4, '#2E3926']),
          pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.08, size: 1 },
        },
        elements: [
          makeShape({ shape: 'rect', name: 'Line', x: CONTENT_X, y: lineY, width: CONTENT_W, height: 1.5, fill: 'rgba(241, 234, 214, 0.55)' }),
          makeText({ text: p.name, name: 'Name', x: 640, y: nameY, width: 800, ...sized(face, size), lineHeight: 1, fill: cream }),
          { ...tagline, y: Math.round(lineY + below) },
          makeShape({ shape: 'ellipse', name: 'Seal', x: 1412, y: 40, width: 108, height: 108, fill: null, stroke: cream, strokeWidth: 1.25 }),
          makeShape({ shape: 'ellipse', name: 'Seal', x: 1420, y: 48, width: 92, height: 92, fill: null, stroke: 'rgba(241, 234, 214, 0.5)', strokeWidth: 1 }),
          tracked(makeText({ text: initials(p.name), name: 'Initials', x: 1412, y: 77, width: 108, align: 'center', fontFamily: F.cormorant, fontWeight: 500, fontSize: 30, letterSpacing: 2, lineHeight: 1, fill: cream })),
        ],
      }
    },
  },
  {
    id: 'haze',
    name: 'Haze',
    build: (p) => ({
      background: {
        fill: mesh('#3A6BC6', [0.04, 0.0, 0.46, '#C9DCF7'], [0.3, 1.0, 0.3, '#E6EEFA'], [1.0, 0.9, 0.5, '#1F4CA8'], [0.78, 0.0, 0.3, '#4E80D6']),
        pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.16, size: 1 },
      },
      elements: vstack([
        { el: balance(makeText({ text: p.tagline, name: 'Tagline', x: CONTENT_X, width: CONTENT_W, align: 'right', fontFamily: F.geist, fontWeight: 700, fontSize: fit(p.tagline, [[24, 80], [40, 66], [60, 54], [99, 46]]), lineHeight: 1, letterSpacing: -2.5, fill: '#FFFFFF' })), gap: 26 },
        { el: tracked(makeText({ text: p.name, name: 'Name', x: CONTENT_X, width: CONTENT_W, align: 'right', fontSize: 14, fontWeight: 600, letterSpacing: 4, uppercase: true, fill: 'rgba(255, 255, 255, 0.86)' })) },
      ]),
    }),
  },
  {
    id: 'connect',
    name: 'Connect',
    build: (p) => {
      const cx = 1060
      return {
        background: {
          fill: mesh('#251914', [0.68, 0.32, 0.4, '#3C2A20'], [0.0, 1.0, 0.3, '#1B120E']),
          pattern: { kind: 'noise', color: '#FFFFFF', opacity: 0.07, size: 1 },
        },
        elements: vstack([
          { el: makeText({ text: 'hello', name: 'Greeting', x: cx - 200, width: 400, align: 'center', fontFamily: F.script, fontWeight: 400, fontSize: 84, lineHeight: 1, fill: '#D7B48F' }), gap: -16 },
          { el: tracked(makeText({ text: "Let's connect", name: 'Headline', x: cx - 460, width: 920, align: 'center', fontFamily: F.cormorant, fontWeight: 500, fontSize: 60, letterSpacing: 14, uppercase: true, lineHeight: 1.1, fill: '#F3EADF' })), gap: 24 },
          { height: 1, gap: 24, build: (y) => [makeShape({ shape: 'rect', name: 'Rule', x: cx - 24, y, width: 48, height: 1, fill: '#D7B48F' })] },
          { el: tracked(balance(makeText({ text: `${p.name}  ·  ${p.tagline}`, name: 'Details', x: cx - 420, width: 840, align: 'center', fontSize: 13, fontWeight: 500, letterSpacing: 3, uppercase: true, lineHeight: 1.6, fill: 'rgba(243, 234, 223, 0.7)' }))) },
        ]),
      }
    },
  },
  {
    id: 'sticker',
    name: 'Sticker',
    build: (p) => {
      const ink = '#151515'
      const face: Face = { fontFamily: F.bricolage, fontWeight: 800, tracking: -0.04 }
      const cardX = 660
      const cardW = 800
      const size = fitSize([p.name], face, cardW - 112, 116, 48)
      const name = makeText({ text: p.name, name: 'Name', x: cardX, width: cardW, align: 'center', ...sized(face, size), lineHeight: 1, fill: ink })
      const padY = 52
      const cardH = name.height + padY * 2
      const cardY = Math.round(MID - cardH / 2 - 16)
      // The label is tilted, so place it by its centre: on the card's bottom edge.
      const label = truncate(p.tagline, 46)
      const labelSize = 15
      const labelW = Math.ceil(measureTextWidth({ text: label, fontFamily: F.geist, fontSize: labelSize, fontWeight: 700, italic: false, letterSpacing: 1.5, uppercase: true })) + 48
      const labelH = 46
      const angle = -4
      const rad = (angle * Math.PI) / 180
      const [cos, sin] = [Math.cos(rad), Math.sin(rad)]
      const lx = cardX + cardW / 2 - (labelW / 2) * cos + (labelH / 2) * sin
      const ly = cardY + cardH - (labelW / 2) * sin - (labelH / 2) * cos
      const textOffset = (labelH - labelSize) / 2
      return {
        background: { fill: '#FF1F4B', pattern: { kind: 'waves', color: '#FF9FCB', opacity: 0.6, size: 64 } },
        elements: [
          makeShape({ shape: 'rect', name: 'Shadow', x: cardX + 12, y: cardY + 12, width: cardW, height: cardH, radius: 28, fill: ink }),
          makeShape({ shape: 'rect', name: 'Card', x: cardX, y: cardY, width: cardW, height: cardH, radius: 28, fill: '#FFF4E0', stroke: ink, strokeWidth: 3 }),
          { ...name, y: cardY + padY },
          makeShape({ shape: 'sparkle', name: 'Sparkle', x: cardX + cardW - 58, y: cardY - 52, width: 104, height: 104, fill: '#FFE14D', stroke: ink, strokeWidth: 3 }),
          makeShape({ shape: 'sparkle', name: 'Sparkle', x: cardX - 30, y: cardY + 14, width: 56, height: 56, fill: '#FFFFFF', stroke: ink, strokeWidth: 3 }),
          makeShape({ shape: 'rect', name: 'Label', x: lx, y: ly, width: labelW, height: labelH, radius: labelH / 2, rotation: angle, fill: '#C8F24B', stroke: ink, strokeWidth: 3 }),
          makeText({ text: label, name: 'Label text', x: lx - textOffset * sin, y: ly + textOffset * cos, width: labelW, rotation: angle, align: 'center', fontFamily: F.geist, fontSize: labelSize, fontWeight: 700, letterSpacing: 1.5, uppercase: true, lineHeight: 1, fill: ink }),
        ],
      }
    },
  },
]

export function instantiate(template: Template, profile: Profile | null | undefined): BannerDoc {
  const { background, elements } = template.build(personaOf(profile))
  return { id: uid(), name: template.name, background, elements, updatedAt: Date.now() }
}

export function blankDoc(): BannerDoc {
  return { id: uid(), name: 'Untitled banner', background: { fill: '#18181B' }, elements: [], updatedAt: Date.now() }
}
