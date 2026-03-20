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
  Inbox,
  Activity,
  BarChart3,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationsQuery } from "@/features/notifications/api/notifications.queries";
import { useMyProfileQuery } from "@/features/profile/api/profile.queries";
import { useI18n } from "@/features/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNav: NavItem[] = [
  { to: "/app/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
  { to: "/app/projects", labelKey: "sidebar.projects", icon: FolderKanban },
  { to: "/app/inbox", labelKey: "sidebar.inbox", icon: Inbox },
  { to: "/app/activity", labelKey: "sidebar.activity", icon: Activity },
  { to: "/app/reports", labelKey: "sidebar.reports", icon: BarChart3 },
  { to: "/app/profile", labelKey: "sidebar.profile", icon: UserCircle2 },
];

const adminNav: NavItem[] = [
  { to: "/app/admin/users", labelKey: "sidebar.users", icon: ShieldCheck },
];

const SIDEBAR_KEY = "taskflow_sidebar_collapsed";

function getInitialCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function SectionTitle({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  if (collapsed) return null;

  return (
    <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
      {children}
    </div>
  );
}

function NavItemRow({
  item,
  collapsed,
  badge,
  label,
}: {
  item: NavItem;
  collapsed: boolean;
  badge?: number;
  label: string;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all",
          "hover:bg-white/55 dark:hover:bg-white/6",
          isActive
            ? "bg-[linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(47_72%_92%/0.72))] text-foreground shadow-sm dark:bg-[linear-gradient(135deg,hsl(var(--primary)/0.24),hsl(200_70%_22%/0.24))]"
            : "text-muted-foreground hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-opacity",
              isActive ? "bg-primary opacity-100" : "opacity-0"
            )}
          />
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          {!collapsed ? <span className="font-medium">{label}</span> : null}
          {!collapsed && badge && badge > 0 ? (
            <Badge variant="secondary" className="ml-auto min-w-5 justify-center px-1.5 text-[10px]">
              {badge > 99 ? "99+" : badge}
            </Badge>
          ) : null}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const role = useAuthStore((s) => s.tokens?.role);
  const username = useAuthStore((s) => s.tokens?.username);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = role === "ADMIN";
  const notificationsQ = useNotificationsQuery({ page: 1, pageSize: 1 });
  const profileQuery = useMyProfileQuery(!!accessToken);
  const unreadCount = notificationsQ.data?.unreadCount ?? 0;
  const { t } = useI18n();
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
    .map((segment) => segment[0]?.toUpperCase())
    .join("");

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col md:flex",
          "transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className={cn("p-4", collapsed ? "pb-3" : "pb-4")}>
          <div className="flex items-center justify-between gap-2 rounded-[22px] border border-white/60 bg-[linear-gradient(180deg,hsl(0_0%_100%/0.56),hsl(0_0%_100%/0.18))] p-3 shadow-[0_18px_30px_-28px_hsl(158_84%_18%/0.45)] dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(221_24%_20%/0.76),hsl(216_22%_15%/0.42))] dark:shadow-[0_18px_32px_-26px_hsl(0_0%_0%/0.55)]">
            <div
              className={cn(
                "flex min-w-0 items-center gap-3",
                collapsed && "w-full justify-center"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-primary/20">
                <img src="/taskflow-mark.svg" alt="TaskFlow" className="h-10 w-10 object-cover" />
              </div>

              {!collapsed ? (
                <div className="min-w-0">
                  <div className="text-base font-semibold leading-none tracking-tight">TaskFlow</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("sidebar.subtitle")}
                  </div>
                </div>
              ) : null}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed((value) => !value)}
                  className="shrink-0 rounded-xl hover:bg-white/60 dark:hover:bg-white/8"
                >
                  {collapsed ? (
                    <ChevronsRight className="h-4 w-4" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? t("common.expand") : t("common.collapse")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 space-y-2 overflow-y-auto p-2">
          <div className="space-y-1">
            <SectionTitle collapsed={collapsed}>{t("common.main")}</SectionTitle>
            {mainNav.map((item) => (
              <NavItemRow
                key={item.to}
                item={item}
                collapsed={collapsed}
                label={t(item.labelKey)}
                badge={item.to === "/app/inbox" ? unreadCount : undefined}
              />
            ))}
          </div>

          {isAdmin ? (
            <div className="space-y-1">
              <SectionTitle collapsed={collapsed}>{t("common.admin")}</SectionTitle>
              {adminNav.map((item) => (
                <NavItemRow
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  label={t(item.labelKey)}
                />
              ))}
            </div>
          ) : null}
        </nav>

        <Separator />

        <div className={cn("p-3", collapsed ? "flex justify-center" : "")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/55 dark:hover:bg-white/8",
                  collapsed && "w-auto px-2"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={profileQuery.data?.avatarUrl ?? undefined}
                    alt={profileQuery.data?.fullName ?? profileQuery.data?.username ?? username ?? "User"}
                  />
                  <AvatarFallback className="text-xs">{initials || "U"}</AvatarFallback>
                </Avatar>

                {!collapsed ? (
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium">
                      {profileQuery.data?.fullName || username || t("common.unknown")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{profileQuery.data?.username ?? username ?? "-"}
                    </div>
                  </div>
                ) : null}

                {!collapsed ? <UserRound className="h-4 w-4 text-muted-foreground" /> : null}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t("sidebar.account")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
