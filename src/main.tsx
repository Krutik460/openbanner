import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/fonts'
import './index.css'
import { App } from './App'
import { useEditor } from './store/editor'
import { useView } from './store/view'

// Handy in the console and for automated checks during development.
if (import.meta.env.DEV) Object.assign(window, { __editor: useEditor, __view: useView })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
