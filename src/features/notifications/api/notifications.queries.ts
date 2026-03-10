import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.api'

export function useNotificationsQuery(params?: {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
  })
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}