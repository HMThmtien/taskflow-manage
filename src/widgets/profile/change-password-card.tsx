import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangeMyPasswordMutation } from '@/features/profile/api/profile.queries'
import { useToast } from '@/hooks/use-toast'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password tối thiểu 6 ký tự'),
    newPassword: z.string().min(8, 'New password tối thiểu 8 ký tự'),
    confirmNewPassword: z.string().min(8, 'Confirm password tối thiểu 8 ký tự'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Confirm password không khớp',
    path: ['confirmNewPassword'],
  })

type FormValues = z.infer<typeof passwordSchema>

export function ChangePasswordCard() {
  const { toast } = useToast()
  const mutation = useChangeMyPasswordMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)

      toast({
        title: 'Đổi mật khẩu thành công',
        description: 'Mật khẩu của bạn đã được cập nhật.',
      })

      form.reset()
    } catch (error) {
      toast({
        title: 'Đổi mật khẩu thất bại',
        description: 'Kiểm tra lại mật khẩu hiện tại hoặc dữ liệu gửi lên.',
        variant: 'destructive',
      })
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...form.register('currentPassword')}
            />
            <p className="text-xs text-destructive">
              {form.formState.errors.currentPassword?.message}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              {...form.register('newPassword')}
            />
            <p className="text-xs text-destructive">
              {form.formState.errors.newPassword?.message}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              {...form.register('confirmNewPassword')}
            />
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmNewPassword?.message}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}