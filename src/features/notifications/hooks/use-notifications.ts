'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { Notification } from '@/types'

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.getNotifications(userId!),
    enabled: !!userId,
    refetchInterval: 30_000, // poll every 30s as fallback
  })

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const unsubscribe = api.subscribeToNotifications(userId, (notification) => {
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
        old ? [notification, ...old] : [notification],
      )
      setUnreadCount((c) => c + 1)
    })
    return unsubscribe
  }, [userId, queryClient])

  // Fetch unread count separately
  const { data: count } = useQuery({
    queryKey: ['notifications', userId, 'unread'],
    queryFn: () => api.getUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (count !== undefined) setUnreadCount(count)
  }, [count])

  return { ...query, unreadCount }
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
