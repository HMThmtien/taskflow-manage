import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "taskflow_theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    // ignore storage errors
  }
  return "light";
}

function shortcutLabel() {
  return navigator.platform.toUpperCase().includes("MAC") ? "Cmd+K" : "Ctrl+K";
}

export function Topbar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const tokens = useAuthStore((s) => s.tokens);
  const logout = useAuthStore((s) => s.logout);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const isDark = theme === "dark";
  const themeLabel = useMemo(() => (isDark ? "Dark" : "Light"), [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        Welcome,{" "}
        <span className="text-foreground">
          {tokens?.username ?? ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onOpenCommandPalette}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search</span>
          <span className="hidden lg:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {shortcutLabel()}
          </span>
        </Button>

        <span className="text-xs rounded-md bg-muted px-2 py-1">
          {tokens?.role}
        </span>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="hidden sm:inline">{themeLabel}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
