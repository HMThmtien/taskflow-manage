import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const mainNav: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
];

const adminNav: NavItem[] = [{ to: "/app/admin/users", label: "Users", icon: ShieldCheck }];

const SIDEBAR_KEY = "taskflow_sidebar_collapsed";

function getInitialCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function SectionTitle({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="px-3 pt-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function NavItemRow({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "relative group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/60",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* ✅ Active indicator bar */}
          <span
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full transition-opacity",
              isActive ? "opacity-100 bg-foreground" : "opacity-0"
            )}
          />
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          {!collapsed ? <span className="font-medium">{item.label}</span> : null}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  // ✅ collapsed thì show tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const role = useAuthStore((s) => s.tokens?.role);
  const username = useAuthStore((s) => s.tokens?.username);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = role === "ADMIN";

  const [collapsed, setCollapsed] = React.useState(getInitialCollapsed);

  React.useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  const initials = (username ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden md:flex h-screen shrink-0 flex-col border-r bg-card/40",
          "transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn("p-4", collapsed ? "pb-3" : "pb-4")}>
          <div className="flex items-center justify-between gap-2">
            <div className={cn("min-w-0", collapsed && "hidden")}>
              <div className="text-lg font-semibold leading-none">TaskFlow</div>
              <div className="mt-1 text-xs text-muted-foreground">SaaS Dashboard</div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed((v) => !v)}
                  className="shrink-0"
                >
                  {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-2">
          <div className="space-y-1">
            <SectionTitle collapsed={collapsed}>MAIN</SectionTitle>
            {mainNav.map((item) => (
              <NavItemRow key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>

          {isAdmin ? (
            <div className="space-y-1">
              <SectionTitle collapsed={collapsed}>ADMIN</SectionTitle>
              {adminNav.map((item) => (
                <NavItemRow key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          ) : null}
        </nav>

        <Separator />

        {/* Footer: Avatar + menu */}
        <div className={cn("p-3", collapsed ? "flex justify-center" : "")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60",
                  collapsed && "w-auto px-2"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials || "U"}</AvatarFallback>
                </Avatar>

                {!collapsed ? (
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium">{username ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">Role: {role ?? "—"}</div>
                  </div>
                ) : null}

                {!collapsed ? <UserRound className="h-4 w-4 text-muted-foreground" /> : null}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  // optional: bạn có thể điều hướng về /login ở RequireAuth hoặc ở nơi khác
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}