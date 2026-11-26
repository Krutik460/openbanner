import { makeIcon, makeImage, makeShape, makeText } from '@/lib/factory'
import { isLightFill } from '@/lib/presets'
import type { AssetMeta } from '@/lib/storage'
import type { ShapeElement, TextElement } from '@/lib/types'
import { useAssets } from '@/store/assets'
import { placement, useEditor } from '@/store/editor'

/** A colour that reads against the current background. */
export function contrastColor(): string {
  return isLightFill(useEditor.getState().doc.background.fill) ? '#18181B' : '#FFFFFF'
}

export function addText(input: Partial<TextElement> & { text: string }): void {
  const el = makeText({ fill: contrastColor(), ...input })
  useEditor.getState().addElements([{ ...el, ...placement(el.width, el.height) }])
}

export function addShape(input: Partial<ShapeElement> & Pick<ShapeElement, 'shape'>): void {
  const outlined = input.fill === null
  const el = makeShape({ ...(outlined ? { stroke: contrastColor(), strokeWidth: 3 } : { fill: contrastColor() }), ...input })
  useEditor.getState().addElements([{ ...el, ...placement(el.width, el.height) }])
}

export function addIcon(icon: string): void {
  const el = makeIcon({ icon, color: contrastColor() })
  useEditor.getState().addElements([{ ...el, ...placement(el.width, el.height) }])
}

export function addImage(asset: AssetMeta): void {
  const el = makeImage(asset.id, asset.width, asset.height)
  useEditor.getState().addElements([{ ...el, ...placement(el.width, el.height) }])
}

/** Imports dropped / pasted / picked image files and places them on the banner. */
export async function addImageFiles(files: Iterable<File>): Promise<number> {
  const added = await useAssets.getState().add(files)
  added.forEach(addImage)
  return added.length
}
