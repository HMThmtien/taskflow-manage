export type GlobalRole = 'USER' | 'ADMIN'

export type ThemePreference = 'light' | 'dark' | 'system'
export type DensityPreference = 'comfortable' | 'compact'
export type DefaultStartPage =
  | 'dashboard'
  | 'my-work'
  | 'projects'
  | 'inbox'
  | 'profile'

export type UserProfile = {
  id: string
  username: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  bio: string | null
  jobTitle: string | null
  timezone: string | null
  locale: string | null
  role: GlobalRole
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type UpdateMyProfileInput = {
  fullName: string
  email: string
  jobTitle?: string | null
  bio?: string | null
  timezone?: string | null
  locale?: string | null
}

export type ChangeMyPasswordInput = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export type UserPreferences = {
  theme: ThemePreference
  density: DensityPreference
  defaultStartPage: DefaultStartPage
  emailNotifications: boolean
  inAppNotifications: boolean
}

export type UpdateMyPreferencesInput = UserPreferences
