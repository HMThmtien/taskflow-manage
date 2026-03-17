import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.api'
import type {
  NotificationItem,
  NotificationsResponse,
} from '../types/notifications.types'

export type NotificationsListParams = {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (params?: NotificationsListParams) =>
    [...notificationsKeys.all, params] as const,
}

function getListParams(queryKey: QueryKey): NotificationsListParams | undefined {
  const [, params] = queryKey
  if (!params || typeof params !== 'object') {
    return undefined
  }

  return params as NotificationsListParams
}

type NotificationsSnapshot = Array<[QueryKey, NotificationsResponse | undefined]>

function mapNotificationsCaches(
  queryClient: QueryClient,
  updater: (
    current: NotificationsResponse,
    params: NotificationsListParams | undefined
  ) => NotificationsResponse
) {
  const entries = queryClient.getQueriesData<NotificationsResponse>({
    queryKey: notificationsKeys.all,
  })

  for (const [queryKey, current] of entries) {
    if (!current) continue
    queryClient.setQueryData<NotificationsResponse>(
      queryKey,
      updater(current, getListParams(queryKey))
    )
  }
}

function restoreNotificationsCaches(
  queryClient: QueryClient,
  snapshots: NotificationsSnapshot | undefined
) {
  if (!snapshots) return

  for (const [queryKey, data] of snapshots) {
    queryClient.setQueryData(queryKey, data)
  }
}

function applyReadState(
  current: NotificationsResponse,
  id: string,
  params?: NotificationsListParams
) {
  const target = current.items.find((item) => item.id === id)
  if (!target || target.isRead) {
    return current
  }

  const nextItems = params?.unreadOnly
    ? current.items.filter((item) => item.id !== id)
    : current.items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )

  return {
    ...current,
    items: nextItems,
    unreadCount: Math.max(0, current.unreadCount - 1),
  }
}

function applyReadAllState(
  current: NotificationsResponse,
  params?: NotificationsListParams
) {
  return {
    ...current,
    items: params?.unreadOnly
      ? []
      : current.items.map((item) => ({ ...item, isRead: true })),
    unreadCount: 0,
  }
}

export function applyIncomingNotification(
  current: NotificationsResponse,
  notification: NotificationItem,
  params?: NotificationsListParams
) {
  const existingIndex = current.items.findIndex((item) => item.id === notification.id)
  const existingItem = existingIndex >= 0 ? current.items[existingIndex] : null

  let nextItems = [...current.items]

  if (params?.unreadOnly && notification.isRead) {
    nextItems =
      existingIndex >= 0
        ? current.items.filter((item) => item.id !== notification.id)
        : current.items
  } else {
    if (existingIndex >= 0) {
      nextItems[existingIndex] = notification
    } else {
      nextItems = [notification, ...current.items]
    }

    if (params?.pageSize && nextItems.length > params.pageSize) {
      nextItems = nextItems.slice(0, params.pageSize)
    } else if (current.pageSize && nextItems.length > current.pageSize) {
      nextItems = nextItems.slice(0, current.pageSize)
    }
  }

  const unreadDelta =
    !existingItem && !notification.isRead
      ? 1
      : existingItem && existingItem.isRead && !notification.isRead
        ? 1
        : existingItem && !existingItem.isRead && notification.isRead
          ? -1
          : 0

  return {
    ...current,
    items: nextItems,
    total: existingItem ? current.total : current.total + 1,
    unreadCount: Math.max(0, current.unreadCount + unreadDelta),
  }
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.all })
      const snapshots = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationsKeys.all,
      })

      mapNotificationsCaches(queryClient, (current, params) =>
        applyReadState(current, id, params)
      )

      return { snapshots }
    },
    onError: (_error, _id, context) => {
      restoreNotificationsCaches(queryClient, context?.snapshots)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKeys.all })
      const snapshots = queryClient.getQueriesData<NotificationsResponse>({
        queryKey: notificationsKeys.all,
      })

      mapNotificationsCaches(queryClient, (current, params) =>
        applyReadAllState(current, params)
      )

      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      restoreNotificationsCaches(queryClient, context?.snapshots)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}
