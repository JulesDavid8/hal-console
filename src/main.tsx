import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Providers } from './lib/providers'

/**
 * H.A.L. Console Entry Point (Foundation 2026)
 * 
 * All cross-cutting concerns (React Query, Toasts, future auth, etc.)
 * are initialized here in a single, easy-to-evolve location.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
