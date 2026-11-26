/**
 * The text lines under the banner on the profile preview. `ProfileMock` lays
 * them out (invisibly) and `ProfileDetails` draws them as fields you can type
 * into, so both read their type from here. Sizes are LinkedIn CSS pixels.
 */
export type ProfileLine = 'name' | 'headline' | 'location'

export const PROFILE_LINES: Record<
  ProfileLine,
  { size: number; weight: number; lineHeight: number; color: string; skeleton: number; bar: string; label: string; placeholder: string }
> = {
  name: { size: 24, weight: 600, lineHeight: 1.25, color: '#191919', skeleton: 190, bar: 'rgb(0 0 0 / 0.09)', label: 'Name', placeholder: 'Your name' },
  headline: { size: 16, weight: 400, lineHeight: 1.4, color: 'rgb(0 0 0 / 0.82)', skeleton: 330, bar: 'rgb(0 0 0 / 0.06)', label: 'Headline', placeholder: 'Your headline' },
  location: { size: 14, weight: 400, lineHeight: 1.4, color: 'rgb(0 0 0 / 0.5)', skeleton: 130, bar: 'rgb(0 0 0 / 0.06)', label: 'Location', placeholder: 'Your location' },
}

export const PROFILE_LINE_ORDER: ProfileLine[] = ['name', 'headline', 'location']

export const PROFILE_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
