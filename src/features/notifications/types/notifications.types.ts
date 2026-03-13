export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_COMMENTED'
  | 'MENTIONED'
  | 'PROJECT_MEMBER_ADDED'
  | 'ROLE_CHANGED'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  actor?: {
    id: string
    username: string
    fullName: string | null
  } | null
  target?: {
    entityType: 'ISSUE' | 'PROJECT' | 'USER'
    entityId: string
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
