import { useEffect, useState } from 'react'

import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/plus-jakarta-sans/wght.css'
import '@fontsource-variable/plus-jakarta-sans/wght-italic.css'
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource-variable/dm-sans/wght-italic.css'
import '@fontsource-variable/outfit/wght.css'
import '@fontsource-variable/sora/wght.css'
import '@fontsource-variable/bricolage-grotesque/wght.css'
import '@fontsource-variable/syne/wght.css'
import '@fontsource-variable/archivo/wght.css'
import '@fontsource-variable/playfair-display/wght.css'
import '@fontsource-variable/playfair-display/wght-italic.css'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import '@fontsource-variable/caveat/wght.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'
import '@fontsource/bebas-neue/400.css'

export interface FontDef {
  label: string
  /** CSS family name as registered by the font package. */
  family: string
  weights: number[]
  group: 'Sans' | 'Serif' | 'Display' | 'Mono & hand'
}

const range = (from: number, to: number) =>
  Array.from({ length: (to - from) / 100 + 1 }, (_, i) => from + i * 100)

export const FONTS: FontDef[] = [
  { label: 'Geist', family: 'Geist Variable', weights: range(300, 900), group: 'Sans' },
  { label: 'Inter', family: 'Inter Variable', weights: range(300, 900), group: 'Sans' },
  { label: 'Manrope', family: 'Manrope Variable', weights: range(300, 800), group: 'Sans' },
  { label: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans Variable', weights: range(300, 800), group: 'Sans' },
  { label: 'DM Sans', family: 'DM Sans Variable', weights: range(300, 900), group: 'Sans' },
  { label: 'Outfit', family: 'Outfit Variable', weights: range(300, 900), group: 'Sans' },
  { label: 'Sora', family: 'Sora Variable', weights: range(300, 800), group: 'Sans' },
  { label: 'Space Grotesk', family: 'Space Grotesk Variable', weights: range(300, 700), group: 'Sans' },
  { label: 'Archivo', family: 'Archivo Variable', weights: range(300, 900), group: 'Sans' },
  { label: 'Bricolage Grotesque', family: 'Bricolage Grotesque Variable', weights: range(300, 800), group: 'Display' },
  { label: 'Syne', family: 'Syne Variable', weights: range(400, 800), group: 'Display' },
  { label: 'Bebas Neue', family: 'Bebas Neue', weights: [400], group: 'Display' },
  { label: 'Instrument Serif', family: 'Instrument Serif', weights: [400], group: 'Serif' },
  { label: 'Playfair Display', family: 'Playfair Display Variable', weights: range(400, 900), group: 'Serif' },
  { label: 'Fraunces', family: 'Fraunces Variable', weights: range(300, 900), group: 'Serif' },
  { label: 'DM Serif Display', family: 'DM Serif Display', weights: [400], group: 'Serif' },
  { label: 'JetBrains Mono', family: 'JetBrains Mono Variable', weights: range(300, 800), group: 'Mono & hand' },
  { label: 'Caveat', family: 'Caveat Variable', weights: range(400, 700), group: 'Mono & hand' },
]

export const FONT_BY_FAMILY = new Map(FONTS.map((font) => [font.family, font]))

export const WEIGHT_NAMES: Record<number, string> = {
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extrabold',
  900: 'Black',
}

export function nearestWeight(family: string, weight: number): number {
  const weights = FONT_BY_FAMILY.get(family)?.weights ?? [weight]
  return weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), weights[0])
}

export function cssFont(family: string, weight: number, italic: boolean, size = 32): string {
  return `${italic ? 'italic ' : ''}${weight} ${size}px "${family}"`
}

/**
 * Canvas text only picks up a web font once the browser has downloaded it.
 * Returns a counter that changes when the face needed for `text` finishes
 * loading, so callers can re-measure.
 */
export function useFontVersion(family: string, weight: number, italic: boolean, text: string): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const font = cssFont(family, weight, italic)
    if (document.fonts.check(font, text)) return
    let live = true
    document.fonts.load(font, text).then(
      () => live && setVersion((v) => v + 1),
      () => {},
    )
    return () => {
      live = false
    }
  }, [family, weight, italic, text])
  return version
}

/** Resolves once every listed face is usable (or has failed); used before measuring template text. */
export function loadFonts(faces: { family: string; weight: number; italic?: boolean }[]): Promise<unknown> {
  return Promise.allSettled(faces.map((f) => document.fonts.load(cssFont(f.family, f.weight, f.italic ?? false))))
}
