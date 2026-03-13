import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.api'

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }) =>
    [...notificationsKeys.all, params] as const,
}

export function useNotificationsQuery(params?: {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => getNotifications(params),
  })
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}
