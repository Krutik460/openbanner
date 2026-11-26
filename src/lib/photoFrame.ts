/**
 * LinkedIn's photo frames, #OpenToWork and #Hiring: a coloured ring over the
 * outer third of the photo, solid round the lower left and fading out towards
 * the upper right, with the hashtag in white along the middle of the solid
 * part. Both share the band and differ only in colour and text. Shared by the
 * editor's canvas and the landing page's SVG.
 */
export type PhotoFrame = 'openToWork' | 'hiring'

export const PHOTO_FRAMES: Record<PhotoFrame, { label: string; text: string; color: string }> = {
  openToWork: { label: '#OpenToWork', text: '#OPENTOWORK', color: '#4B7634' },
  hiring: { label: '#Hiring', text: '#HIRING', color: '#7A47C4' },
}

/**
 * The band both frames share. Angles are clockwise from 3 o'clock, as the
 * canvas and SVG measure them; lengths are fractions of the photo's radius.
 */
export const FRAME_BAND = {
  family: 'Source Sans 3 Variable',
  weight: 600,
  /** Where the ring and the text are centred. */
  center: 120,
  /** The ring's inner edge. */
  inner: 0.67,
  /**
   * The fade runs along the line from the photo's centre through `center`:
   * clear up to `fadeFrom` along it, solid from `fadeTo`. That leaves the ring
   * solid from about 5 to 9 o'clock and gone by 4 and 10.
   */
  fadeFrom: 0.04,
  fadeTo: 0.46,
  font: 0.23,
  /** Letter spacing as a fraction of the font size. */
  tracking: 0.07,
} as const

/** The band's geometry for a photo of `radius` centred at (`r`, `r`). */
export function photoFrameLayout(r: number, radius: number) {
  const band = FRAME_BAND
  const rad = (deg: number) => (deg * Math.PI) / 180
  const at = (deg: number, dist: number) => ({ x: r + dist * Math.cos(rad(deg)), y: r + dist * Math.sin(rad(deg)) })
  const fontSize = band.font * radius
  // Glyphs stand on the path and grow towards the centre, so the baseline sits
  // half a cap height outside the band's middle to centre the capitals in it.
  const baseline = ((1 + band.inner) / 2) * radius + fontSize * 0.33
  // An arc running anticlockwise on screen, so the text reads left to right along the bottom.
  const from = at(band.center + 100, baseline)
  const to = at(band.center - 100, baseline)
  return {
    innerRadius: band.inner * radius,
    fadeStart: at(band.center, band.fadeFrom * radius),
    fadeEnd: at(band.center, band.fadeTo * radius),
    fontSize,
    letterSpacing: fontSize * band.tracking,
    textPath: `M ${from.x} ${from.y} A ${baseline} ${baseline} 0 1 0 ${to.x} ${to.y}`,
  }
}
