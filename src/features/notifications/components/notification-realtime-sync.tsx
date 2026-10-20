'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user'
import { subscribeToNotifications } from '../api'
import type { Notification } from '@/types'

/**
 * Suscripción Realtime a `public.notifications`.
 *
 * Se monta UNA sola vez (en `AppShell`) porque el hook `useNotifications` lo
 * usan varios componentes a la vez (la campana del sidebar y la página de
 * notificaciones): si cada uno se suscribiera por su cuenta, el servidor
 * entregaría el evento duplicado y el `removeChannel` de una instancia
 * cortaría la de la otra.
 *
 * Este componente no renderiza nada: sólo mantiene la cache de TanStack
 * Query al día.
 */
export function NotificationRealtimeSync() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToNotifications(userId, (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
        old ? [notification, ...old] : [notification],
      )
      // El contador de no leídos vive en su propia query: hay que refrescarla.
      queryClient.invalidateQueries({ queryKey: ['notifications', userId, 'unread'] })
    })

    return unsubscribe
  }, [userId, queryClient])

  return null
}
