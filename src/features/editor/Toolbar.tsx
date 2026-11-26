import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Popover } from 'radix-ui'
import { Image as ImageIcon, LayoutTemplate, PaintBucket, Shapes, Type } from 'lucide-react'
import { BackgroundPanel } from './panels/BackgroundPanel'
import { ElementsPanel } from './panels/ElementsPanel'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { TextPanel } from './panels/TextPanel'
import { UploadsPanel } from './panels/UploadsPanel'

interface Tool {
  id: string
  label: string
  icon: typeof Type
  width: number
  /** `close` lets a panel dismiss itself once it has added something to the banner. */
  content: (close: () => void) => ReactNode
}

const TOOLS: Tool[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, width: 576, content: () => <TemplatesPanel /> },
  { id: 'text', label: 'Text', icon: Type, width: 280, content: (close) => <TextPanel onAdd={close} /> },
  { id: 'shapes', label: 'Shapes', icon: Shapes, width: 340, content: (close) => <ElementsPanel onAdd={close} /> },
  { id: 'image', label: 'Image', icon: ImageIcon, width: 320, content: (close) => <UploadsPanel onAdd={close} /> },
  { id: 'background', label: 'Background', icon: PaintBucket, width: 340, content: () => <BackgroundPanel /> },
]

/** The only toolbar: five things you can add or change, each opening a small panel above it. */
export function Toolbar() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <nav aria-label="Tools" className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-2xl bg-pop p-1.5 shadow-pop">
      {TOOLS.map(({ id, label, icon: Icon, width, content }) => (
        <Popover.Root key={id} open={open === id} onOpenChange={(next) => setOpen(next ? id : null)}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={clsx(
                'flex h-10 items-center gap-2 rounded-xl px-3 text-[13px] font-medium transition-colors max-sm:flex-col max-sm:gap-0.5 max-sm:px-2 max-sm:text-[10px]',
                open === id ? 'bg-fg text-white' : 'text-fg hover:bg-hover',
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {label}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              sideOffset={14}
              collisionPadding={12}
              aria-label={label}
              className="z-40 max-h-[min(560px,calc(100vh-200px))] max-w-[calc(100vw-24px)] animate-pop overflow-y-auto rounded-2xl bg-pop p-4 shadow-pop outline-none"
              style={{ width }}
            >
              {content(() => setOpen(null))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ))}
    </nav>
  )
}
