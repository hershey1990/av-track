'use client'

import { useEffect } from 'react'

const SW_VERSION_KEY = 'bb-sw-version'
const CURRENT_SW_VERSION = 'v3'

export function PWARegister() {
  useEffect(() => {
    // Clear old localStorage-based Supabase sessions (migrated to cookies)
    const storedVersion = localStorage.getItem(SW_VERSION_KEY)
    if (storedVersion !== CURRENT_SW_VERSION) {
      // Remove old supabase auth data from localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('supabase.auth')) {
          localStorage.removeItem(key)
        }
      }
      localStorage.setItem(SW_VERSION_KEY, CURRENT_SW_VERSION)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // If there's a waiting SW, notify user and reload when ready
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New SW available — reload to activate it
                window.location.reload()
              }
            })
          }
        })
      })

      // If the SW is already waiting, reload
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    }
  }, [])

  return null
}
