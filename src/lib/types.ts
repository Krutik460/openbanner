import type { PhotoFrame } from './photoFrame'

export interface GradientStop {
  offset: number
  color: string
}

export interface LinearGradient {
  type: 'linear'
  /** CSS-style angle: 0 points up, 90 points right. */
  angle: number
  stops: GradientStop[]
}

export interface MeshBlob {
  /** Centre as a fraction of the banner; radius as a fraction of its width. */
  x: number
  y: number
  r: number
  color: string
}

export interface MeshGradient {
  type: 'mesh'
  base: string
  blobs: MeshBlob[]
}

export type Fill = string | LinearGradient
export type BackgroundFill = Fill | MeshGradient

export type PatternKind = 'dots' | 'grid' | 'lines' | 'waves' | 'noise'

export interface Pattern {
  kind: PatternKind
  color: string
  opacity: number
  /** Spacing in banner pixels (ignored by noise). */
  size: number
}

export interface Background {
  fill: BackgroundFill
  image?: { assetId: string; opacity: number }
  pattern?: Pattern
}

interface BaseElement {
  id: string
  name?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked?: boolean
  hidden?: boolean
}

export type TextAlign = 'left' | 'center' | 'right'

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  fill: string
  align: TextAlign
  lineHeight: number
  letterSpacing: number
  uppercase: boolean
}

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'arrow' | 'blob' | 'quarter' | 'arch' | 'sparkle' | 'ribbon'

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: ShapeKind
  fill: Fill | null
  stroke: string | null
  strokeWidth: number
  /** Corner radius; only meaningful for rectangles. */
  radius: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  assetId: string
  radius: number
}

export interface IconElement extends BaseElement {
  type: 'icon'
  icon: string
  color: string
  strokeWidth: number
}

export type BannerElement = TextElement | ShapeElement | ImageElement | IconElement

export interface BannerDoc {
  id: string
  name: string
  background: Background
  elements: BannerElement[]
  updatedAt: number
}

export interface Profile {
  handle?: string
  name: string
  headline: string
  location?: string
  /** data: URL */
  avatar?: string
  /** Preview one of LinkedIn's photo frames (#OpenToWork, #Hiring). Never part of the exported banner. */
  frame?: PhotoFrame
}

export type Device = 'desktop' | 'mobile'
