import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  useMyPreferencesQuery,
  useUpdateMyPreferencesMutation,
} from '@/features/profile/api/profile.queries'
import type { UserPreferences } from '@/features/profile/types/profile.types'

export function PreferencesCard() {
  const { toast } = useToast()
  const prefsQuery = useMyPreferencesQuery()
  const mutation = useUpdateMyPreferencesMutation()

  const form = useForm<UserPreferences>({
    defaultValues: {
      theme: 'system',
      density: 'comfortable',
      defaultStartPage: 'dashboard',
      emailNotifications: true,
      inAppNotifications: true,
    },
  })

  useEffect(() => {
    if (!prefsQuery.data) return
    form.reset(prefsQuery.data)
  }, [prefsQuery.data, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const data = await mutation.mutateAsync(values)

      if (data.theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else if (data.theme === 'light') {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      } else {
        localStorage.setItem('theme', 'system')
      }

      toast({
        title: 'Đã lưu preferences',
        description: 'Thiết lập cá nhân đã được cập nhật.',
      })
    } catch (error) {
      toast({
        title: 'Lưu preferences thất bại',
        description: 'Không thể cập nhật thiết lập cá nhân.',
        variant: 'destructive',
      })
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Input id="theme" {...form.register('theme')} placeholder="light | dark | system" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">Density</Label>
            <Input
              id="density"
              {...form.register('density')}
              placeholder="comfortable | compact"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultStartPage">Default start page</Label>
            <Input
              id="defaultStartPage"
              {...form.register('defaultStartPage')}
              placeholder="dashboard | my-work | projects | inbox | profile"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('emailNotifications')} />
            Email notifications
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('inAppNotifications')} />
            In-app notifications
          </label>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}