export type ActivityType =
  | 'ISSUE_CREATED'
  | 'ISSUE_UPDATED'
  | 'ISSUE_MOVED'
  | 'COMMENT_CREATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'

export type ActivityItem = {
  id: number
  type: ActivityType
  message: string
  createdAt: string
  actor: {
    id: number
    username: string
    fullName: string | null
  } | null
  project?: {
    id: number
    key: string
    name: string
  } | null
  target?: {
    entityType: 'ISSUE' | 'PROJECT' | 'USER'
    entityId: number
    label: string
    route?: string
  } | null
}

export type ActivityResponse = {
  items: ActivityItem[]
  page: number
  pageSize: number
  total: number
}