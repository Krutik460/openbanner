import { BANNER } from '@/lib/constants'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface Guide {
  axis: 'x' | 'y'
  /** Position in banner pixels. */
  at: number
}

const stops = (start: number, size: number) => [start, start + size / 2, start + size]

/** Lines the dragged box may snap to: banner edges and centre, plus every other element. */
export function snapTargets(others: Box[]): { x: number[]; y: number[] } {
  return {
    x: [0, BANNER.width / 2, BANNER.width, ...others.flatMap((b) => stops(b.x, b.width))],
    y: [0, BANNER.height / 2, BANNER.height, ...others.flatMap((b) => stops(b.y, b.height))],
  }
}

function nearest(edges: number[], targets: number[], tolerance: number): { delta: number; at: number } | null {
  let best: { delta: number; at: number } | null = null
  for (const edge of edges) {
    for (const target of targets) {
      const delta = target - edge
      if (Math.abs(delta) <= tolerance && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, at: target }
    }
  }
  return best
}

/** How far to shift `box` so an edge or its centre lands on a target, and which guides to show. */
export function snap(box: Box, targets: { x: number[]; y: number[] }, tolerance: number): { dx: number; dy: number; guides: Guide[] } {
  const sx = nearest(stops(box.x, box.width), targets.x, tolerance)
  const sy = nearest(stops(box.y, box.height), targets.y, tolerance)
  const guides: Guide[] = []
  if (sx) guides.push({ axis: 'x', at: sx.at })
  if (sy) guides.push({ axis: 'y', at: sy.at })
  return { dx: sx?.delta ?? 0, dy: sy?.delta ?? 0, guides }
}
