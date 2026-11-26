import type { Context } from 'konva/lib/Context'
import type { LinearGradient, ShapeKind } from '@/lib/types'

/** Traces a shape's outline inside the box (0,0)-(w,h). The caller begins and fills the path. */
export function traceShape(ctx: Context, kind: ShapeKind, w: number, h: number, radius: number): void {
  switch (kind) {
    case 'rect': {
      const r = Math.max(0, Math.min(radius, w / 2, h / 2))
      ctx.moveTo(r, 0)
      ctx.arcTo(w, 0, w, h, r)
      ctx.arcTo(w, h, 0, h, r)
      ctx.arcTo(0, h, 0, 0, r)
      ctx.arcTo(0, 0, w, 0, r)
      break
    }
    case 'ellipse':
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      break
    case 'triangle':
      polygon(ctx, [[w / 2, 0], [w, h], [0, h]])
      break
    case 'diamond':
      polygon(ctx, [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])
      break
    case 'hexagon':
      polygon(ctx, [[w * 0.25, 0], [w * 0.75, 0], [w, h / 2], [w * 0.75, h], [w * 0.25, h], [0, h / 2]])
      break
    case 'star': {
      const points: [number, number][] = []
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        const reach = i % 2 === 0 ? 0.5 : 0.21
        // Stretch a unit star so its tips touch the box edges.
        points.push([w * (0.5 + (Math.cos(angle) * reach) / 0.951), h * (0.5528 + (Math.sin(angle) * reach) / 0.9045)])
      }
      polygon(ctx, points)
      break
    }
    case 'arrow': {
      const head = Math.min(w * 0.5, h * 0.9)
      const shaft = h * 0.28
      polygon(ctx, [
        [0, h / 2 - shaft / 2], [w - head, h / 2 - shaft / 2], [w - head, 0], [w, h / 2],
        [w - head, h], [w - head, h / 2 + shaft / 2], [0, h / 2 + shaft / 2],
      ])
      break
    }
    case 'blob':
      ctx.moveTo(w * 0.5, 0)
      ctx.bezierCurveTo(w * 0.86, -h * 0.02, w * 1.04, h * 0.3, w * 0.97, h * 0.58)
      ctx.bezierCurveTo(w * 0.9, h * 0.88, w * 0.62, h * 1.04, w * 0.38, h * 0.97)
      ctx.bezierCurveTo(w * 0.12, h * 0.9, -w * 0.04, h * 0.66, w * 0.03, h * 0.4)
      ctx.bezierCurveTo(w * 0.09, h * 0.16, w * 0.24, h * 0.02, w * 0.5, 0)
      break
    case 'quarter':
      ctx.moveTo(w, h)
      ctx.lineTo(0, h)
      ctx.ellipse(w, h, w, h, 0, Math.PI, Math.PI * 1.5)
      break
    case 'arch': {
      const r = Math.min(w / 2, h)
      ctx.moveTo(0, h)
      ctx.lineTo(0, r)
      ctx.arc(w / 2, r, w / 2, Math.PI, 0)
      ctx.lineTo(w, h)
      break
    }
  }
}

function polygon(ctx: Context, points: [number, number][]): void {
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
}

/** Konva gradient props for a CSS-style angled gradient across a w x h box. */
export function linearGradientProps(gradient: LinearGradient, w: number, h: number) {
  const a = (gradient.angle * Math.PI) / 180
  const dx = Math.sin(a)
  const dy = -Math.cos(a)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  return {
    fillPriority: 'linear-gradient' as const,
    fillLinearGradientStartPoint: { x: w / 2 - dx * half, y: h / 2 - dy * half },
    fillLinearGradientEndPoint: { x: w / 2 + dx * half, y: h / 2 + dy * half },
    fillLinearGradientColorStops: gradient.stops.flatMap((stop) => [stop.offset, stop.color]),
  }
}

const noiseTiles = new Map<string, HTMLCanvasElement>()

/** A repeatable grain tile in the given colour. */
export function noiseTile(color: string): HTMLCanvasElement {
  let tile = noiseTiles.get(color)
  if (!tile) {
    tile = document.createElement('canvas')
    tile.width = tile.height = 192
    const ctx = tile.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    const data = ctx.createImageData(tile.width, tile.height)
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = r
      data.data[i + 1] = g
      data.data[i + 2] = b
      data.data[i + 3] = Math.random() * 255
    }
    ctx.putImageData(data, 0, 0)
    noiseTiles.set(color, tile)
  }
  return tile
}
