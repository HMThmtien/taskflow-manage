import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from '@/features/profile/api/profile.queries'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  jobTitle: z.string().optional(),
  bio: z.string().max(300, 'Bio tối đa 300 ký tự').optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
})

type FormValues = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { toast } = useToast()
  const profileQuery = useMyProfileQuery()
  const updateMutation = useUpdateMyProfileMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      jobTitle: '',
      bio: '',
      timezone: 'Asia/Bangkok',
      locale: 'vi-VN',
    },
  })

  useEffect(() => {
    if (!profileQuery.data) return

    form.reset({
      fullName: profileQuery.data.fullName ?? '',
      email: profileQuery.data.email ?? '',
      jobTitle: profileQuery.data.jobTitle ?? '',
      bio: profileQuery.data.bio ?? '',
      timezone: profileQuery.data.timezone ?? 'Asia/Bangkok',
      locale: profileQuery.data.locale ?? 'vi-VN',
    })
  }, [profileQuery.data, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        jobTitle: values.jobTitle || null,
        bio: values.bio || null,
        timezone: values.timezone || null,
        locale: values.locale || null,
      })

      toast({
        title: 'Đã lưu profile',
        description: 'Thông tin cá nhân đã được cập nhật.',
      })
    } catch (error) {
      toast({
        title: 'Lưu thất bại',
        description: 'Không thể cập nhật profile.',
        variant: 'destructive',
      })
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...form.register('fullName')} />
              <p className="text-xs text-destructive">
                {form.formState.errors.fullName?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...form.register('email')} />
              <p className="text-xs text-destructive">
                {form.formState.errors.email?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" {...form.register('jobTitle')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" {...form.register('timezone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Input id="locale" {...form.register('locale')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={5} {...form.register('bio')} />
            <p className="text-xs text-destructive">
              {form.formState.errors.bio?.message}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}