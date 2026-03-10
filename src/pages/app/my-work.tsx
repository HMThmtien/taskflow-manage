import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useMyWorkQuery } from '@/features/my-work/api/my-work.queries'
import type { MyWorkTab } from '@/features/my-work/types/my-work.types'

const tabs: MyWorkTab[] = ['assigned', 'created', 'watching', 'overdue']

export default function MyWorkPage() {
  const [tab, setTab] = useState<MyWorkTab>('assigned')
  const [q, setQ] = useState('')

  const params = useMemo(
    () => ({
      type: tab,
      q: q || undefined,
    }),
    [tab, q]
  )

  const query = useMyWorkQuery(params)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">My Work</h1>
        <p className="text-sm text-muted-foreground">
          Tập trung các issue liên quan trực tiếp tới bạn.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-md border px-3 py-2 text-sm ${
              tab === item ? 'bg-foreground text-background' : ''
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <Input
        placeholder="Search issues..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {query.isLoading ? <div>Loading...</div> : null}
      {query.isError ? (
        <div className="text-destructive">Không tải được My Work.</div>
      ) : null}

      <div className="space-y-3">
        {query.data?.map((issue) => (
          <div key={issue.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">{issue.key}</div>
                <div className="font-medium">{issue.title}</div>
                <div className="text-sm text-muted-foreground">
                  {issue.projectName} · {issue.status} · {issue.priority}
                </div>
              </div>

              <div className="text-right text-sm text-muted-foreground">
                <div>Due: {issue.dueDate || '—'}</div>
                <div>Updated: {new Date(issue.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}

        {!query.isLoading && query.data?.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Không có issue nào trong mục này.
          </div>
        ) : null}
      </div>
    </div>
  )
}