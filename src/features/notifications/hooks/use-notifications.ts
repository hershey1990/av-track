'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'

export function useNotifications(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.getNotifications(userId!),
    enabled: !!userId,
    refetchInterval: 30_000, // poll every 30s as fallback
  })

  // El contador de no leídos se mantiene en su propia query para que sea la
  // única fuente de verdad (antes se duplicaba con un useState local).
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', userId, 'unread'],
    queryFn: () => api.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  })

  return { ...query, unreadCount: unreadCount ?? 0 }
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllAsRead(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
