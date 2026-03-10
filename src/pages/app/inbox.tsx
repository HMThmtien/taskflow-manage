import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '@/features/notifications/api/notifications.queries'

export default function InboxPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const query = useNotificationsQuery({ unreadOnly, page: 1, pageSize: 20 })
  const markOne = useMarkNotificationAsReadMutation()
  const markAll = useMarkAllNotificationsAsReadMutation()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Thông báo hệ thống và activity liên quan tới bạn.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUnreadOnly((v) => !v)}>
            {unreadOnly ? 'Show all' : 'Unread only'}
          </Button>
          <Button onClick={() => markAll.mutate()}>Mark all as read</Button>
        </div>
      </div>

      {query.isLoading ? <div>Loading...</div> : null}
      {query.isError ? (
        <div className="text-destructive">Không tải được notifications.</div>
      ) : null}

      <div className="space-y-3">
        {query.data?.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border p-4 ${item.isRead ? '' : 'border-emerald-500'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.body}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              {!item.isRead ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markOne.mutate(item.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          </div>
        ))}

        {!query.isLoading && query.data?.items.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Không có thông báo nào.
          </div>
        ) : null}
      </div>
    </div>
  )
}