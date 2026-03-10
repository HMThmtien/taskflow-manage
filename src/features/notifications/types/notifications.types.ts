export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_COMMENTED'
  | 'MENTIONED'
  | 'PROJECT_MEMBER_ADDED'
  | 'ROLE_CHANGED'

export type NotificationItem = {
  id: number
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  actor?: {
    id: number
    username: string
    fullName: string | null
  } | null
  target?: {
    entityType: 'ISSUE' | 'PROJECT' | 'USER'
    entityId: number
    route: string
  } | null
}

export type NotificationsResponse = {
  items: NotificationItem[]
  page: number
  pageSize: number
  total: number
  unreadCount: number
}