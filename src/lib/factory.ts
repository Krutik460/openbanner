import Konva from 'konva'
import { BANNER } from './constants'
import type { Fill, IconElement, ImageElement, ShapeElement, ShapeKind, TextElement } from './types'
import { uid } from './util'

type TextInput = Partial<Omit<TextElement, 'type' | 'id' | 'height'>> & { text: string }

export function displayText(el: Pick<TextElement, 'text' | 'uppercase'>): string {
  return el.uppercase ? el.text.toUpperCase() : el.text
}

/** Height Konva will give this text once wrapped to its width. */
export function measureTextHeight(el: Omit<TextElement, 'id' | 'height'>): number {
  return new Konva.Text({
    text: displayText(el),
    width: el.width,
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontStyle: `${el.italic ? 'italic ' : ''}${el.fontWeight}`,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
  }).height()
}

export function measureTextWidth(el: Pick<TextElement, 'text' | 'uppercase' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'italic' | 'letterSpacing'>): number {
  return new Konva.Text({
    text: displayText(el),
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontStyle: `${el.italic ? 'italic ' : ''}${el.fontWeight}`,
    letterSpacing: el.letterSpacing,
  }).width()
}

export function makeText(input: TextInput): TextElement {
  const base = {
    type: 'text' as const,
    x: 0,
    y: 0,
    width: 600,
    rotation: 0,
    opacity: 1,
    fontFamily: 'Geist Variable',
    fontSize: 48,
    fontWeight: 600,
    italic: false,
    fill: '#FFFFFF',
    align: 'left' as const,
    lineHeight: 1.15,
    letterSpacing: 0,
    uppercase: false,
    ...input,
  }
  return { ...base, id: uid(), height: measureTextHeight(base) }
}

type ShapeInput = Partial<Omit<ShapeElement, 'type' | 'id'>> & { shape: ShapeKind }

export function makeShape(input: ShapeInput): ShapeElement {
  return {
    type: 'shape',
    id: uid(),
    x: 0,
    y: 0,
    width: 160,
    height: 160,
    rotation: 0,
    opacity: 1,
    fill: '#FFFFFF' as Fill,
    stroke: null,
    strokeWidth: 0,
    radius: 0,
    ...input,
  }
}

export function makeIcon(input: Partial<Omit<IconElement, 'type' | 'id'>> & { icon: string }): IconElement {
  return {
    type: 'icon',
    id: uid(),
    x: 0,
    y: 0,
    width: 96,
    height: 96,
    rotation: 0,
    opacity: 1,
    color: '#FFFFFF',
    strokeWidth: 1.75,
    ...input,
  }
}

export function makeImage(assetId: string, width: number, height: number): ImageElement {
  // Fit inside the banner with some breathing room, keeping the aspect ratio.
  const scale = Math.min(1, (BANNER.height * 0.8) / height, (BANNER.width * 0.5) / width)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  return {
    type: 'image',
    id: uid(),
    assetId,
    x: Math.round((BANNER.width - w) / 2),
    y: Math.round((BANNER.height - h) / 2),
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    radius: 0,
  }
}
