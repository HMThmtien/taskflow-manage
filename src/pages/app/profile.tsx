import { PageState } from "@/components/app/page-state";
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
    return <PageState kind="loading" title={t("profile.loading")} />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PageState
        kind="error"
        title={t("profile.error")}
        description="We could not load your profile details right now."
        actionLabel={t("common.retry")}
        onAction={() => {
          void profileQuery.refetch();
        }}
      />
    );
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
