import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { UserProfile } from '@/features/profile/types/profile.types'

type Props = {
  profile: UserProfile
}

function getInitials(name?: string | null, username?: string) {
  const source = name?.trim() || username || 'U'
  return source
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileHeader({ profile }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {getInitials(profile.fullName, profile.username)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {profile.fullName || profile.username}
            </h1>
            <Badge variant="secondary">{profile.role}</Badge>
          </div>

          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{profile.email}</span>
            {profile.jobTitle ? <span>{profile.jobTitle}</span> : null}
            {profile.timezone ? <span>{profile.timezone}</span> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}