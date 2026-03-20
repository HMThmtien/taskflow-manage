import { useRef, type ChangeEvent } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/features/i18n/i18n"
import {
  useRemoveMyAvatarMutation,
  useUploadMyAvatarMutation,
} from "@/features/profile/api/profile.queries"
import type { UserProfile } from "@/features/profile/types/profile.types"
import { useToast } from "@/hooks/use-toast"
import { Camera, Trash2 } from "lucide-react"

type Props = {
  profile: UserProfile
}

function getInitials(name?: string | null, username?: string) {
  const source = name?.trim() || username || "U"
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
}

export function ProfileHeader({ profile }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const uploadAvatarMutation = useUploadMyAvatarMutation()
  const removeAvatarMutation = useRemoveMyAvatarMutation()
  const { toast } = useToast()
  const { t } = useI18n()

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    try {
      await uploadAvatarMutation.mutateAsync(file)
      toast({
        title: t("profile.avatar.updatedTitle"),
        description: t("profile.avatar.updatedDescription"),
      })
    } catch {
      toast({
        title: t("profile.avatar.errorTitle"),
        description: t("profile.avatar.errorDescription"),
        variant: "destructive",
      })
    }
  }

  async function handleRemoveAvatar() {
    try {
      await removeAvatarMutation.mutateAsync()
      toast({
        title: t("profile.avatar.removedTitle"),
        description: t("profile.avatar.removedDescription"),
      })
    } catch {
      toast({
        title: t("profile.avatar.errorTitle"),
        description: t("profile.avatar.errorDescription"),
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-1 ring-border/70 shadow-sm">
              <AvatarImage
                src={profile.avatarUrl ?? undefined}
                alt={profile.fullName ?? profile.username}
              />
              <AvatarFallback className="bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {getInitials(profile.fullName, profile.username)}
              </AvatarFallback>
            </Avatar>

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                  disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                  title={profile.avatarUrl
                    ? t("profile.avatar.actions")
                    : uploadAvatarMutation.isPending
                      ? t("profile.avatar.uploading")
                      : t("profile.avatar.upload")}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => inputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  {profile.avatarUrl
                    ? t("profile.avatar.change")
                    : t("profile.avatar.upload")}
                </DropdownMenuItem>
                {profile.avatarUrl ? (
                  <DropdownMenuItem
                    onClick={handleRemoveAvatar}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {removeAvatarMutation.isPending
                      ? t("profile.avatar.removing")
                      : t("profile.avatar.remove")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
