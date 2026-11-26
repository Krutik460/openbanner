import { describe, expect, it } from 'vitest'
import { ribbonLines } from './shapes'

describe('ribbonLines', () => {
  const w = 900
  const h = 300
  const lines = ribbonLines(w, h, 24, 96)

  it('draws every strand across the full width of the box', () => {
    expect(lines).toHaveLength(24)
    for (const line of lines) {
      expect(line).toHaveLength(97)
      expect(line[0][0]).toBe(0)
      expect(line[line.length - 1][0]).toBe(w)
    }
  })

  it('stays inside the box', () => {
    for (const [x, y] of lines.flat()) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(w)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(h)
    }
  })

  it('twists: the outer strands swap sides along the way', () => {
    const first = lines[0]
    const last = lines[lines.length - 1]
    const sides = first.map(([, y], i) => Math.sign(last[i][1] - y))
    expect(sides).toContain(1)
    expect(sides).toContain(-1)
  })
})
