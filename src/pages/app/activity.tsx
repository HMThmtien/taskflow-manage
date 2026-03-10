import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useActivityQuery } from '@/features/activity/api/activity.queries'

export default function ActivityPage() {
  const [q, setQ] = useState('')
  const query = useActivityQuery({ q, page: 1, pageSize: 20 })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Luồng thay đổi trên toàn workspace.
        </p>
      </div>

      <Input
        placeholder="Search activity..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {query.isLoading ? <div>Loading...</div> : null}
      {query.isError ? (
        <div className="text-destructive">Không tải được activity.</div>
      ) : null}

      <div className="space-y-3">
        {query.data?.items.map((item) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="font-medium">{item.message}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {item.actor?.fullName || item.actor?.username || 'System'} ·{' '}
              {new Date(item.createdAt).toLocaleString()}
            </div>
            {item.project ? (
              <div className="mt-2 text-xs text-muted-foreground">
                {item.project.key} · {item.project.name}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}