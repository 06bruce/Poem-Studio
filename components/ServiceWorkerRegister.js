'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../lib/serviceWorker'

// Mounted once near the root layout — registers the service worker (see
// public/sw.js) that caches static assets and the anonymous poems feed so
// repeat visits paint instantly.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
