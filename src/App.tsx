import { useEffect } from 'react'
import { Tooltip } from 'radix-ui'
import { Editor } from '@/features/editor/Editor'
import { Welcome } from '@/features/welcome/Welcome'
import { useEditor } from '@/store/editor'
import { followHistory, restore, startAutosave } from '@/store/persistence'

export function App() {
  const screen = useEditor((s) => s.screen)

  useEffect(() => {
    void restore()
    const stopAutosave = startAutosave()
    const stopHistory = followHistory()
    return () => (stopAutosave(), stopHistory())
  }, [])

  return (
    <Tooltip.Provider delayDuration={350} skipDelayDuration={200}>
      {screen === 'loading' ? null : screen === 'welcome' ? <Welcome /> : <Editor />}
    </Tooltip.Provider>
  )
}
