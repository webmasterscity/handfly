import '@fontsource/atkinson-hyperlegible-next/latin-400.css'
import '@fontsource/atkinson-hyperlegible-next/latin-700.css'
import '@fontsource/b612/latin-400.css'
import '@fontsource/b612/latin-700.css'
import '@fontsource/b612-mono/latin-400.css'
import './styles/index.css'
import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { applyDocumentSettings } from './core/settings/settings'

applyDocumentSettings()

// Pide al navegador que no borre los datos locales bajo presión de espacio.
void navigator.storage?.persist?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
