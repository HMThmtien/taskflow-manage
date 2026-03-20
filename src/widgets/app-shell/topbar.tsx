import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyProfileQuery, useUpdateMyProfileMutation } from "@/features/profile/api/profile.queries";
import { type AppLocale, normalizeLocale, useI18n } from "@/features/i18n/i18n";
import { useAuthStore } from "@/stores/auth.store";
import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "taskflow_theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {}
  return "light";
}

function shortcutLabel() {
  return navigator.platform.toUpperCase().includes("MAC") ? "Cmd+K" : "Ctrl+K";
}

function getInitials(name?: string | null, username?: string) {
  const source = name?.trim() || username || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function Topbar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const tokens = useAuthStore((s) => s.tokens);
  const logout = useAuthStore((s) => s.logout);
  const profileQuery = useMyProfileQuery(!!tokens?.accessToken);
  const updateProfileMutation = useUpdateMyProfileMutation();
  const { locale, setLocale, t, languages } = useI18n();
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const isDark = theme === "dark";
  const themeLabel = useMemo(
    () => (isDark ? t("common.dark") : t("common.light")),
    [isDark, t]
  );

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  async function handleLocaleChange(nextLocale: string) {
    const normalized = normalizeLocale(nextLocale) as AppLocale;
    if (normalized === locale) return;

    setLocale(normalized);

    if (!profileQuery.data) return;

    try {
      await updateProfileMutation.mutateAsync({
        fullName: profileQuery.data.fullName ?? profileQuery.data.username,
        email: profileQuery.data.email,
        jobTitle: profileQuery.data.jobTitle ?? null,
        bio: profileQuery.data.bio ?? null,
        timezone: profileQuery.data.timezone ?? null,
        locale: normalized,
      });
    } catch {
      // Keep local selection even if persistence fails.
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        {t("topbar.welcome", { username: tokens?.username ?? "" })}{" "}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onOpenCommandPalette}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">{t("common.search")}</span>
          <span className="hidden lg:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {shortcutLabel()}
          </span>
        </Button>

        <Select value={locale} onValueChange={handleLocaleChange}>
          <SelectTrigger className="hidden w-[148px] sm:flex">
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

        <span className="rounded-md bg-muted px-2 py-1 text-xs">{tokens?.role}</span>

        <Avatar className="h-9 w-9 ring-1 ring-border/70">
          <AvatarImage
            src={profileQuery.data?.avatarUrl ?? undefined}
            alt={profileQuery.data?.fullName ?? profileQuery.data?.username ?? tokens?.username ?? "User"}
          />
          <AvatarFallback className="text-xs">
            {getInitials(profileQuery.data?.fullName, profileQuery.data?.username ?? tokens?.username)}
          </AvatarFallback>
        </Avatar>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          title={t("topbar.switchTheme", {
            theme: isDark ? t("common.light") : t("common.dark"),
          })}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="hidden sm:inline">{themeLabel}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={logout}>
          {t("common.logout")}
        </Button>
      </div>
    </header>
  );
}
