import { useEffect, useState } from 'react'
import { EditorStage } from '@/canvas/EditorStage'
import { fitView } from '@/canvas/fit'
import { Toaster } from '@/components/Toaster'
import { useEditor } from '@/store/editor'
import { toast } from '@/store/toasts'
import { useView } from '@/store/view'
import { addImageFiles } from './actions'
import { ContextBar } from './ContextBar'
import { CoverageWarning } from './CoverageWarning'
import { Hint } from './Hint'
import { ProfileMock } from './ProfileMock'
import { Toolbar } from './Toolbar'
import { TopBar } from './TopBar'
import { ViewControls } from './ViewControls'

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // A popover or menu already handled this key (e.g. Escape to close it).
      if (e.defaultPrevented) return
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      // Keys pressed inside an open popover, menu or slider belong to that control.
      if (target.closest('[role="dialog"], [role="listbox"], [role="menu"], [role="slider"]')) return
      const editor = useEditor.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      const done = () => e.preventDefault()

      if (mod && key === 'z') return done(), e.shiftKey ? editor.redo() : editor.undo()
      if (mod && key === 'y') return done(), editor.redo()
      if (mod && key === 'd') return done(), editor.duplicateSelected()
      if (mod && key === 'a') return done(), editor.select(editor.doc.elements.filter((el) => !el.locked && !el.hidden).map((el) => el.id))
      if (mod && key === 'c') return editor.copy()
      if (mod && key === 'x') return editor.copy(), editor.removeSelected()
      if (mod && (key === '=' || key === '+')) return done(), useView.getState().zoomTo(useView.getState().scale * 1.25)
      if (mod && key === '-') return done(), useView.getState().zoomTo(useView.getState().scale / 1.25)
      if (mod && key === '0') return done(), useView.getState().zoomTo(1)
      if (mod) return

      if (key === 'delete' || key === 'backspace') return done(), editor.removeSelected()
      if (key === 'escape') return editor.select([])
      if (key === '1') return fitView()
      if (key === ']') return editor.reorder('forward')
      if (key === '[') return editor.reorder('backward')
      // Enter on a focused button should press the button, not start editing.
      if (key === 'enter' && editor.selection.length === 1 && !target.closest('button, a')) {
        const el = editor.doc.elements.find((item) => item.id === editor.selection[0])
        if (el?.type === 'text') return done(), editor.setEditing(el.id)
      }
      const step = e.shiftKey ? 10 : 1
      const move: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] }
      if (move[key] && editor.selection.length) return done(), editor.nudge(...move[key])
    }

    // Paste: an image from the clipboard is added to the banner; otherwise paste copied elements.
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      const images = [...(e.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'))
      if (images.length) {
        e.preventDefault()
        void addImageFiles(images)
      } else {
        useEditor.getState().paste()
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [])
}

/** The editor: a header, the banner on its profile preview, and one toolbar. */
export function Editor() {
  useShortcuts()
  const [dropping, setDropping] = useState(false)
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes('Files')

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main
        className="workspace relative min-h-0 flex-1 overflow-hidden"
        onDragOver={(e) => hasFiles(e) && (e.preventDefault(), setDropping(true))}
        onDragLeave={(e) => e.currentTarget === e.target && setDropping(false)}
        onDrop={(e) => {
          if (!hasFiles(e)) return
          e.preventDefault()
          setDropping(false)
          void addImageFiles(e.dataTransfer.files).then((count) => count === 0 && toast('Only image files can be added', { tone: 'error' }))
        }}
      >
        <ProfileMock />
        <EditorStage />
        <ContextBar />
        <Hint />
        <CoverageWarning />
        <ViewControls />
        <Toolbar />
        <Toaster />
        {dropping && (
          <div className="pointer-events-none absolute inset-3 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/10 text-base font-medium">
            Drop to add to your banner
          </div>
        )}
      </main>
    </div>
  )
}
