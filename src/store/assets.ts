import { create } from 'zustand'
import { importImage } from '@/lib/assets'
import { deleteAsset, listAssets, type AssetMeta } from '@/lib/storage'

interface AssetState {
  assets: AssetMeta[]
  loaded: boolean
  load: () => Promise<void>
  /** Stores image files; returns the ones that were accepted. */
  add: (files: Iterable<Blob & { name?: string }>) => Promise<AssetMeta[]>
  remove: (id: string) => Promise<void>
}

export const useAssets = create<AssetState>((set, get) => ({
  assets: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return
    set({ assets: await listAssets().catch(() => []), loaded: true })
  },
  add: async (files) => {
    const added: AssetMeta[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      try {
        added.push(await importImage(file, file.name?.replace(/\.[^.]+$/, '') || 'Image'))
      } catch {
        // Unreadable image: skip it and keep going with the rest.
      }
    }
    if (added.length) set({ assets: [...added.reverse(), ...get().assets] })
    return added
  },
  remove: async (id) => {
    await deleteAsset(id)
    set({ assets: get().assets.filter((asset) => asset.id !== id) })
  },
}))
