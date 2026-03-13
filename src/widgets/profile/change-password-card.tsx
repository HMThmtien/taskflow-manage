import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/features/i18n/i18n";
import { useChangeMyPasswordMutation } from "@/features/profile/api/profile.queries";
import { useToast } from "@/hooks/use-toast";

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export function ChangePasswordCard() {
  const { toast } = useToast();
  const { t } = useI18n();
  const mutation = useChangeMyPasswordMutation();

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(6, t("profile.security.validation.currentPassword")),
          newPassword: z.string().min(8, t("profile.security.validation.newPassword")),
          confirmNewPassword: z
            .string()
            .min(8, t("profile.security.validation.confirmNewPassword")),
        })
        .refine((data) => data.newPassword === data.confirmNewPassword, {
          message: t("profile.security.validation.mismatch"),
          path: ["confirmNewPassword"],
        }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);

      toast({
        title: t("profile.security.successTitle"),
        description: t("profile.security.successDescription"),
      });

      form.reset();
    } catch {
      toast({
        title: t("profile.security.errorTitle"),
        description: t("profile.security.errorDescription"),
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.security.title")}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("profile.security.currentPassword")}</Label>
            <Input id="currentPassword" type="password" {...form.register("currentPassword")} />
            <p className="text-xs text-destructive">
              {form.formState.errors.currentPassword?.message}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("profile.security.newPassword")}</Label>
            <Input id="newPassword" type="password" {...form.register("newPassword")} />
            <p className="text-xs text-destructive">
              {form.formState.errors.newPassword?.message}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">
              {t("profile.security.confirmNewPassword")}
            </Label>
            <Input
              id="confirmNewPassword"
              type="password"
              {...form.register("confirmNewPassword")}
            />
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmNewPassword?.message}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("profile.security.updating") : t("profile.security.updatePassword")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
