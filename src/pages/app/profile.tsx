import { ChangePasswordCard } from '@/widgets/profile/change-password-card'
import { ProfileHeader } from '@/widgets/profile/profile-header'
import { ProfileForm } from '@/widgets/profile/profile-form'
import { PreferencesCard } from '@/widgets/profile/preferences-card'
import { useMyProfileQuery } from '@/features/profile/api/profile.queries'

export default function ProfilePage() {
  const profileQuery = useMyProfileQuery()

  if (profileQuery.isLoading) {
    return <div className="p-6">Loading profile...</div>
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <div className="p-6 text-destructive">Không tải được profile.</div>
  }

  return (
    <div className="space-y-6 p-6">
      <ProfileHeader profile={profileQuery.data} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ProfileForm />

        <div className="space-y-6">
          <ChangePasswordCard />
          <PreferencesCard />
        </div>
      </div>
    </div>
  )
}