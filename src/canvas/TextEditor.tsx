import { useLayoutEffect, useRef } from 'react'
import { measureTextHeight } from '@/lib/factory'
import type { TextElement } from '@/lib/types'
import { useEditor } from '@/store/editor'
import { useView } from '@/store/view'

/** A textarea laid exactly over a text element so it can be edited in place. */
export function TextEditor({ el }: { el: TextElement }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const { x, y, scale } = useView()

  useLayoutEffect(() => {
    const area = ref.current
    if (!area) return
    area.focus()
    area.select()
  }, [])

  // Grow with the content so nothing scrolls inside the box.
  useLayoutEffect(() => {
    const area = ref.current
    if (!area) return
    area.style.height = '0px'
    area.style.height = `${area.scrollHeight}px`
  }, [el.text, el.width, el.fontSize, el.fontFamily, el.fontWeight, el.lineHeight, el.letterSpacing, scale])

  const finish = () => {
    const state = useEditor.getState()
    state.setEditing(null)
    if (!el.text.trim()) {
      state.select([el.id])
      state.removeSelected()
    } else {
      // Typing may have changed how many lines the text takes.
      state.patchElements([el.id], { height: measureTextHeight(el) }, `typing:${el.id}`)
    }
  }

  return (
    <textarea
      ref={ref}
      value={el.text}
      spellCheck={false}
      aria-label="Edit text"
      onChange={(e) => useEditor.getState().patchElements([el.id], { text: e.target.value }, `typing:${el.id}`)}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) e.currentTarget.blur()
      }}
      className="absolute z-20 m-0 resize-none overflow-hidden border-0 bg-transparent p-0 outline-[1.5px] outline-offset-4 outline-[var(--select)] outline-dashed"
      style={{
        left: x + el.x * scale,
        top: y + el.y * scale,
        width: el.width * scale,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'top left',
        fontFamily: `"${el.fontFamily}"`,
        fontSize: el.fontSize * scale,
        fontWeight: el.fontWeight,
        fontStyle: el.italic ? 'italic' : 'normal',
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing * scale,
        textAlign: el.align,
        textTransform: el.uppercase ? 'uppercase' : 'none',
        color: el.fill,
        caretColor: el.fill,
        opacity: el.opacity,
      }}
    />
  )
}
