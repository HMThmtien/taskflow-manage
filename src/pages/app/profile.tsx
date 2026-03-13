import { useI18n } from "@/features/i18n/i18n";
import { useMyProfileQuery } from "@/features/profile/api/profile.queries";
import { ChangePasswordCard } from "@/widgets/profile/change-password-card";
import { ProfileHeader } from "@/widgets/profile/profile-header";
import { ProfileForm } from "@/widgets/profile/profile-form";
import { PreferencesCard } from "@/widgets/profile/preferences-card";

export default function ProfilePage() {
  const profileQuery = useMyProfileQuery();
  const { t } = useI18n();

  if (profileQuery.isLoading) {
    return <div className="p-6">{t("profile.loading")}</div>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <div className="p-6 text-destructive">{t("profile.error")}</div>;
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
  );
}
