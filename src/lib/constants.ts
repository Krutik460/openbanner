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
