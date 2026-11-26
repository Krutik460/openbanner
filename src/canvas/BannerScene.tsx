import { memo, useLayoutEffect, useRef } from 'react'
import { Image as KImage, Rect, Shape, Text } from 'react-konva'
import type Konva from 'konva'
import { useAssetImage } from '@/lib/assets'
import { BANNER } from '@/lib/constants'
import { displayText } from '@/lib/factory'
import { useFontVersion } from '@/lib/fonts'
import { useIconImage } from '@/lib/icons'
import type { Background, BannerElement, IconElement, ImageElement, ShapeElement, TextElement } from '@/lib/types'
import { withAlpha } from '@/lib/util'
import { linearGradientProps, noiseTile, traceShape } from './shapes'

const { width: W, height: H } = BANNER

export const BackgroundNodes = memo(function BackgroundNodes({ background }: { background: Background }) {
  const { fill, image, pattern } = background
  const photo = useAssetImage(image?.assetId)

  // Scale the photo to cover the banner, cropping the overflow evenly.
  let crop: { x: number; y: number; width: number; height: number } | undefined
  if (photo) {
    const ratio = Math.max(W / photo.naturalWidth, H / photo.naturalHeight)
    const cw = W / ratio
    const ch = H / ratio
    crop = { x: (photo.naturalWidth - cw) / 2, y: (photo.naturalHeight - ch) / 2, width: cw, height: ch }
  }

  return (
    <>
      {typeof fill === 'string' ? (
        <Rect name="bg" width={W} height={H} fill={fill} />
      ) : fill.type === 'linear' ? (
        <Rect name="bg" width={W} height={H} {...linearGradientProps(fill, W, H)} />
      ) : (
        <Shape
          name="bg"
          width={W}
          height={H}
          blobs={fill.blobs}
          base={fill.base}
          sceneFunc={(ctx) => {
            ctx.fillStyle = fill.base
            ctx.fillRect(0, 0, W, H)
            for (const blob of fill.blobs) {
              const cx = blob.x * W
              const cy = blob.y * H
              const r = blob.r * W
              const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
              gradient.addColorStop(0, blob.color)
              gradient.addColorStop(1, withAlpha(blob.color, 0))
              ctx.fillStyle = gradient
              ctx.fillRect(0, 0, W, H)
            }
          }}
          hitFunc={(ctx, shape) => {
            ctx.beginPath()
            ctx.rect(0, 0, W, H)
            ctx.closePath()
            ctx.fillStrokeShape(shape)
          }}
        />
      )}
      {photo && crop && <KImage name="bg" image={photo} width={W} height={H} crop={crop} opacity={image!.opacity} />}
      {pattern?.kind === 'noise' && (
        <Rect listening={false} width={W} height={H} fillPatternImage={noiseTile(pattern.color) as unknown as HTMLImageElement} opacity={pattern.opacity} />
      )}
      {pattern && pattern.kind !== 'noise' && (
        <Shape
          listening={false}
          opacity={pattern.opacity}
          kind={pattern.kind}
          size={pattern.size}
          color={pattern.color}
          sceneFunc={(ctx) => {
            const step = Math.max(6, pattern.size)
            ctx.fillStyle = pattern.color
            if (pattern.kind === 'dots') {
              const r = Math.max(1, step * 0.06)
              ctx.beginPath()
              for (let x = step / 2; x < W; x += step) {
                for (let y = step / 2; y < H; y += step) {
                  ctx.moveTo(x + r, y)
                  ctx.arc(x, y, r, 0, Math.PI * 2)
                }
              }
              ctx.fill()
            } else if (pattern.kind === 'grid') {
              for (let x = step; x < W; x += step) ctx.fillRect(x, 0, 1, H)
              for (let y = step; y < H; y += step) ctx.fillRect(0, y, W, 1)
            } else {
              ctx.strokeStyle = pattern.color
              ctx.lineWidth = 1
              ctx.beginPath()
              for (let x = -H; x < W; x += step) {
                ctx.moveTo(x, H)
                ctx.lineTo(x + H, 0)
              }
              ctx.stroke()
            }
          }}
        />
      )}
    </>
  )
})

/** Extra Konva props (handlers, draggable) the editor attaches to each element node. */
export type NodeBinder = (el: BannerElement) => Konva.NodeConfig & Record<string, unknown>

interface ElementProps<T extends BannerElement> {
  el: T
  bind?: NodeBinder
  /** Hide the canvas text while it is being edited in place. */
  editing?: boolean
}

function common(el: BannerElement, bind?: NodeBinder) {
  return {
    id: el.id,
    name: 'el',
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    visible: !el.hidden,
    listening: Boolean(bind) && !el.locked,
    ...bind?.(el),
  }
}

function TextNode({ el, bind, editing }: ElementProps<TextElement>) {
  const ref = useRef<Konva.Text>(null)
  const text = displayText(el)
  const fontVersion = useFontVersion(el.fontFamily, el.fontWeight, el.italic, text)

  // Konva measured the text with a fallback font; measure again now the real one is in.
  useLayoutEffect(() => {
    if (fontVersion === 0) return
    const node = ref.current
    if (!node) return
    const family = node.fontFamily()
    node.fontFamily('')
    node.fontFamily(family)
    node.getLayer()?.batchDraw()
  }, [fontVersion])

  return (
    <Text
      ref={ref}
      {...common(el, bind)}
      visible={!el.hidden && !editing}
      text={text}
      width={el.width}
      fontFamily={el.fontFamily}
      fontSize={el.fontSize}
      fontStyle={`${el.italic ? 'italic ' : ''}${el.fontWeight}`}
      fill={el.fill}
      align={el.align}
      lineHeight={el.lineHeight}
      letterSpacing={el.letterSpacing}
    />
  )
}

function ShapeNode({ el, bind }: ElementProps<ShapeElement>) {
  const fillProps =
    el.fill === null
      ? { fill: undefined, fillPriority: 'color' as const }
      : typeof el.fill === 'string'
        ? { fill: el.fill, fillPriority: 'color' as const }
        : { fill: undefined, ...linearGradientProps(el.fill, el.width, el.height) }
  return (
    <Shape
      {...common(el, bind)}
      width={el.width}
      height={el.height}
      kind={el.shape}
      radius={el.radius}
      {...fillProps}
      stroke={el.stroke ?? undefined}
      strokeWidth={el.stroke ? el.strokeWidth : 0}
      // Outline-only shapes stay easy to grab without blocking what is inside them.
      hitStrokeWidth={Math.max(el.strokeWidth, 14)}
      lineJoin="round"
      sceneFunc={(ctx, shape) => {
        ctx.beginPath()
        traceShape(ctx, el.shape, shape.width(), shape.height(), el.radius)
        ctx.closePath()
        ctx.fillStrokeShape(shape)
      }}
    />
  )
}

function ImageNode({ el, bind }: ElementProps<ImageElement>) {
  const image = useAssetImage(el.assetId)
  const radius = Math.min(el.radius, el.width / 2, el.height / 2)
  if (!image) {
    return <Rect {...common(el, bind)} width={el.width} height={el.height} cornerRadius={radius} fill="rgba(127, 127, 127, 0.25)" />
  }
  return <KImage {...common(el, bind)} image={image} width={el.width} height={el.height} cornerRadius={radius} />
}

function IconNode({ el, bind }: ElementProps<IconElement>) {
  const image = useIconImage(el.icon, el.color, el.strokeWidth)
  return <KImage {...common(el, bind)} image={image} width={el.width} height={el.height} />
}

export const ElementNode = memo(function ElementNode({ el, bind, editing }: ElementProps<BannerElement>) {
  switch (el.type) {
    case 'text':
      return <TextNode el={el} bind={bind} editing={editing} />
    case 'shape':
      return <ShapeNode el={el} bind={bind} />
    case 'image':
      return <ImageNode el={el} bind={bind} />
    case 'icon':
      return <IconNode el={el} bind={bind} />
  }
})
