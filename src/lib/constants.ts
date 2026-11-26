import type { Device } from './types'

export const APP_NAME = 'Openbanner'

/** LinkedIn's recommended personal banner size. */
export const BANNER = { width: 1584, height: 396 } as const

/**
 * Where the profile photo sits over the banner, in banner pixels (bounding box
 * of the circle including its border ring). LinkedIn does not publish these, so
 * they are measured approximations of the current web and mobile layouts.
 */
export const AVATAR: Record<Device, { x: number; y: number; d: number; ring: number }> = {
  desktop: { x: 47, y: 175, d: 315, ring: 8 },
  mobile: { x: 64, y: 186, d: 424, ring: 12 },
}

const SAMPLE_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD3A8"/><stop offset="1" stop-color="#FF8FA3"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><path d="M22 200c2-46 34-66 78-66s76 20 78 66z" fill="#22243A"/><path d="M84 118h32v26c0 9-7 14-16 14s-16-5-16-14z" fill="#7A4A30"/><ellipse cx="100" cy="90" rx="35" ry="40" fill="#8D5A3B"/><path d="M60 96c-8-40 12-66 42-66 32 0 50 26 40 66-2-22-12-36-34-40-22 2-42 14-48 40z" fill="#17171C"/></svg>`

/** A fictional person for trying the app without a real profile. */
export const SAMPLE_PROFILE = {
  avatar: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_AVATAR_SVG)}`,
  handle: 'maya-okafor',
  name: 'Maya Okafor',
  headline: 'Product designer at Northwind | Design systems · Speaker',
  location: 'Lisbon, Portugal',
}
