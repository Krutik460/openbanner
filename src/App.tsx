import { useEffect } from 'react'
import { Tooltip } from 'radix-ui'
import { Editor } from '@/features/editor/Editor'
import { Welcome } from '@/features/welcome/Welcome'
import { useEditor } from '@/store/editor'
import { restore, startAutosave } from '@/store/persistence'

export function App() {
  const screen = useEditor((s) => s.screen)

  useEffect(() => {
    void restore()
    return startAutosave()
  }, [])

  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={200}>
      {screen === 'loading' ? null : screen === 'welcome' ? (
        <div className="h-full overflow-y-auto">
          <Welcome />
        </div>
      ) : (
        <Editor />
      )}
    </Tooltip.Provider>
  )
}
