import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type AppLocale, useI18n } from "@/features/i18n/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/features/profile/api/profile.queries";

type FormValues = {
  fullName: string;
  email: string;
  jobTitle?: string;
  bio?: string;
  timezone?: string;
  locale?: string;
};

export function ProfileForm() {
  const { toast } = useToast();
  const { t, languages, setLocale, locale } = useI18n();
  const profileQuery = useMyProfileQuery();
  const updateMutation = useUpdateMyProfileMutation();

  const profileSchema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t("profile.form.validation.fullName")),
        email: z.string().email(t("profile.form.validation.email")),
        jobTitle: z.string().optional(),
        bio: z.string().max(300, t("profile.form.validation.bio")).optional(),
        timezone: z.string().optional(),
        locale: z.string().optional(),
      }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      jobTitle: "",
      bio: "",
      timezone: "Asia/Bangkok",
      locale,
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    form.reset({
      fullName: profileQuery.data.fullName ?? "",
      email: profileQuery.data.email ?? "",
      jobTitle: profileQuery.data.jobTitle ?? "",
      bio: profileQuery.data.bio ?? "",
      timezone: profileQuery.data.timezone ?? "Asia/Bangkok",
      locale: profileQuery.data.locale ?? locale,
    });
  }, [form, locale, profileQuery.data]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        jobTitle: values.jobTitle || null,
        bio: values.bio || null,
        timezone: values.timezone || null,
        locale: values.locale || null,
      });

      if (values.locale) {
        setLocale(values.locale as AppLocale);
      }

      toast({
        title: t("profile.form.savedTitle"),
        description: t("profile.form.savedDescription"),
      });
    } catch {
      toast({
        title: t("profile.form.errorTitle"),
        description: t("profile.form.errorDescription"),
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.form.title")}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("profile.form.fullName")}</Label>
              <Input id="fullName" {...form.register("fullName")} />
              <p className="text-xs text-destructive">{form.formState.errors.fullName?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.form.email")}</Label>
              <Input id="email" {...form.register("email")} />
              <p className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t("profile.form.jobTitle")}</Label>
              <Input id="jobTitle" {...form.register("jobTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t("profile.form.timezone")}</Label>
              <Input id="timezone" {...form.register("timezone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">{t("profile.form.locale")}</Label>
            <Controller
              control={form.control}
              name="locale"
              render={({ field }) => (
                <Select value={field.value ?? locale} onValueChange={field.onChange}>
                  <SelectTrigger id="locale">
                    <SelectValue placeholder={t("common.language")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("profile.form.bio")}</Label>
            <Textarea id="bio" rows={5} {...form.register("bio")} />
            <p className="text-xs text-destructive">{form.formState.errors.bio?.message}</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.saving") : t("profile.form.saveChanges")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
