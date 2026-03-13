import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/features/i18n/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  useMyPreferencesQuery,
  useUpdateMyPreferencesMutation,
} from "@/features/profile/api/profile.queries";
import type { UserPreferences } from "@/features/profile/types/profile.types";

export function PreferencesCard() {
  const { toast } = useToast();
  const { t } = useI18n();
  const prefsQuery = useMyPreferencesQuery();
  const mutation = useUpdateMyPreferencesMutation();

  const form = useForm<UserPreferences>({
    defaultValues: {
      theme: "system",
      density: "comfortable",
      defaultStartPage: "dashboard",
      emailNotifications: true,
      inAppNotifications: true,
    },
  });

  useEffect(() => {
    if (!prefsQuery.data) return;
    form.reset(prefsQuery.data);
  }, [prefsQuery.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const data = await mutation.mutateAsync(values);

      if (data.theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else if (data.theme === "light") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        localStorage.setItem("theme", "system");
      }

      toast({
        title: t("profile.preferences.savedTitle"),
        description: t("profile.preferences.savedDescription"),
      });
    } catch {
      toast({
        title: t("profile.preferences.errorTitle"),
        description: t("profile.preferences.errorDescription"),
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.preferences.title")}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">{t("profile.preferences.theme")}</Label>
            <Input id="theme" {...form.register("theme")} placeholder="light | dark | system" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">{t("profile.preferences.density")}</Label>
            <Input id="density" {...form.register("density")} placeholder="comfortable | compact" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultStartPage">{t("profile.preferences.defaultStartPage")}</Label>
            <Input
              id="defaultStartPage"
              {...form.register("defaultStartPage")}
              placeholder="dashboard | my-work | projects | inbox | profile"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("emailNotifications")} />
            {t("profile.preferences.emailNotifications")}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("inAppNotifications")} />
            {t("profile.preferences.inAppNotifications")}
          </label>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("common.saving") : t("profile.preferences.savePreferences")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
