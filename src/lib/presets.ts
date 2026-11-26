import type { BackgroundFill, LinearGradient, MeshGradient, Pattern } from './types'

export const linear = (angle: number, ...colors: string[]): LinearGradient => ({
  type: 'linear',
  angle,
  stops: colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color })),
})

export const mesh = (base: string, ...blobs: [x: number, y: number, r: number, color: string][]): MeshGradient => ({
  type: 'mesh',
  base,
  blobs: blobs.map(([x, y, r, color]) => ({ x, y, r, color })),
})

export const SOLIDS = [
  '#0A0A0B', '#18181B', '#1E293B', '#0B3D91', '#0A66C2', '#0F766E', '#14532D', '#4C1D95', '#9D174D', '#B91C1C',
  '#EA580C', '#F5B700', '#C8F24B', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8', '#F2EDE3', '#F5F5F4', '#FFFFFF',
]

export const GRADIENTS: LinearGradient[] = [
  linear(115, '#FF7A59', '#FF3D81', '#7B2FF7'),
  linear(120, '#0B4FA8', '#072B5F'),
  linear(100, '#0F2A1D', '#1B5E3F'),
  linear(135, '#111827', '#1F2937', '#374151'),
  linear(110, '#FDE68A', '#FCA5A5', '#F0ABFC'),
  linear(100, '#22D3EE', '#3B82F6', '#6366F1'),
  linear(125, '#FF512F', '#F09819'),
  linear(120, '#C8F24B', '#34D399'),
  linear(110, '#E0EAFC', '#CFDEF3'),
  linear(105, '#1A1A2E', '#3A1C71', '#D76D77'),
  linear(100, '#F5F5F4', '#E7E5E4'),
  linear(120, '#0F172A', '#0E7490'),
]

export const MESHES: MeshGradient[] = [
  mesh('#070B1A', [0.12, 0.1, 0.42, '#1D4ED8'], [0.86, 0.95, 0.46, '#7C3AED'], [0.6, -0.1, 0.34, '#06B6D4'], [1.02, 0.15, 0.3, '#DB2777']),
  mesh('#FFF4EC', [0.08, 0.2, 0.38, '#FFB199'], [0.5, 1.0, 0.4, '#C9B6FF'], [0.92, 0.1, 0.4, '#A8D8FF'], [0.72, 0.6, 0.26, '#B8F2D0']),
  mesh('#0A0A0B', [0.9, 0.0, 0.4, '#C8F24B'], [0.1, 1.1, 0.36, '#16A34A'], [0.55, 0.5, 0.2, '#0E7490']),
  mesh('#1B0B2E', [0.15, 0.9, 0.42, '#F43F5E'], [0.85, 0.1, 0.42, '#F59E0B'], [0.5, 0.4, 0.3, '#7C3AED']),
  mesh('#EEF2FF', [0.1, 0.0, 0.36, '#93C5FD'], [0.95, 1.0, 0.44, '#A5B4FC'], [0.6, 0.2, 0.26, '#FBCFE8']),
  mesh('#04111F', [0.2, 0.2, 0.44, '#0EA5E9'], [0.8, 0.9, 0.42, '#14B8A6'], [1.0, 0.0, 0.28, '#6366F1']),
  mesh('#FDF6E3', [0.05, 0.9, 0.38, '#FDBA74'], [0.95, 0.05, 0.4, '#FDE047'], [0.5, 0.5, 0.26, '#FCA5A5']),
  mesh('#101014', [0.3, -0.2, 0.4, '#52525B'], [0.9, 1.1, 0.44, '#3F3F46'], [0.7, 0.3, 0.2, '#71717A']),
]

export const PATTERNS: { label: string; pattern: Omit<Pattern, 'color'> | null }[] = [
  { label: 'None', pattern: null },
  { label: 'Grain', pattern: { kind: 'noise', opacity: 0.12, size: 1 } },
  { label: 'Dots', pattern: { kind: 'dots', opacity: 0.16, size: 28 } },
  { label: 'Grid', pattern: { kind: 'grid', opacity: 0.1, size: 44 } },
  { label: 'Lines', pattern: { kind: 'lines', opacity: 0.1, size: 22 } },
  { label: 'Waves', pattern: { kind: 'waves', opacity: 0.08, size: 30 } },
]

/** Rough perceived lightness, used to pick readable defaults over a background. */
export function isLightFill(fill: BackgroundFill): boolean {
  const color = typeof fill === 'string' ? fill : fill.type === 'mesh' ? fill.base : fill.stops[0]?.color
  const hex = color?.match(/^#([0-9a-f]{6})$/i)?.[1]
  if (!hex) return false
  const n = parseInt(hex, 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150
}

/** CSS preview of a fill for a swatch whose width is `aspect` times its height. */
export function fillToCss(fill: BackgroundFill, aspect = 4): string {
  if (typeof fill === 'string') return fill
  if (fill.type === 'linear') {
    return `linear-gradient(${fill.angle}deg, ${fill.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`
  }
  // Blob radii are fractions of the width; as a share of the height they are `aspect` times larger.
  const blobs = fill.blobs.map(
    (b) =>
      `radial-gradient(ellipse ${b.r * 100}% ${b.r * aspect * 100}% at ${b.x * 100}% ${b.y * 100}%, ${b.color}, transparent)`,
  )
  return [...blobs.reverse(), fill.base].join(', ')
}
