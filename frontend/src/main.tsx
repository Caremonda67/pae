import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// El service worker (PWA) lo registra vite-plugin-pwa automaticamente
// en el build de produccion (opcion registerType: 'autoUpdate').
