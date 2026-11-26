import { del, get, set } from 'idb-keyval'
import type { BannerDoc, Profile } from './types'

/**
 * Everything the app remembers lives in this browser: designs, uploaded
 * images and the profile in IndexedDB, small preferences in localStorage.
 */

export interface DesignMeta {
  id: string
  name: string
  updatedAt: number
}

export interface AssetMeta {
  id: string
  name: string
  width: number
  height: number
}

const KEY = {
  profile: 'profile',
  designs: 'designs',
  design: (id: string) => `design:${id}`,
  assets: 'assets',
  asset: (id: string) => `asset:${id}`,
  current: 'openbanner:current-design',
}

export const loadProfile = () => get<Profile>(KEY.profile)
export const saveProfile = (profile: Profile) => set(KEY.profile, profile)

export const listDesigns = async () => (await get<DesignMeta[]>(KEY.designs)) ?? []
export const loadDesign = (id: string) => get<BannerDoc>(KEY.design(id))

export async function saveDesign(doc: BannerDoc): Promise<void> {
  await set(KEY.design(doc.id), doc)
  const meta: DesignMeta = { id: doc.id, name: doc.name, updatedAt: doc.updatedAt }
  const designs = (await listDesigns()).filter((d) => d.id !== doc.id)
  await set(KEY.designs, [meta, ...designs])
}

export function getCurrentDesignId(): string | null {
  try {
    return localStorage.getItem(KEY.current)
  } catch {
    return null
  }
}

export function setCurrentDesignId(id: string): void {
  try {
    localStorage.setItem(KEY.current, id)
  } catch {
    // Private mode or storage disabled: the design still saves, we just reopen the most recent one.
  }
}

export const listAssets = async () => (await get<AssetMeta[]>(KEY.assets)) ?? []
export const loadAssetBlob = (id: string) => get<Blob>(KEY.asset(id))

export async function saveAsset(meta: AssetMeta, blob: Blob): Promise<void> {
  await set(KEY.asset(meta.id), blob)
  await set(KEY.assets, [meta, ...(await listAssets())])
}

export async function deleteAsset(id: string): Promise<void> {
  await del(KEY.asset(id))
  await set(KEY.assets, (await listAssets()).filter((a) => a.id !== id))
}
