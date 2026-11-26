import { memo } from 'react'
import { Group, Layer, Stage } from 'react-konva'
import { BANNER } from '@/lib/constants'
import type { BannerDoc } from '@/lib/types'
import { BackgroundNodes, ElementNode } from './BannerScene'

/** A non-interactive render of a design at the given CSS width (thumbnails, previews). */
export const StaticBanner = memo(function StaticBanner({ doc, width }: { doc: Pick<BannerDoc, 'background' | 'elements'>; width: number }) {
  const scale = width / BANNER.width
  return (
    <Stage width={width} height={Math.round(BANNER.height * scale)} listening={false}>
      <Layer listening={false}>
        <Group scaleX={scale} scaleY={scale}>
          <BackgroundNodes background={doc.background} />
          {doc.elements.map((el) => (
            <ElementNode key={el.id} el={el} />
          ))}
        </Group>
      </Layer>
    </Stage>
  )
})
