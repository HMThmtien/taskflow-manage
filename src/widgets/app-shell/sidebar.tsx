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
import { useI18n } from "@/features/i18n/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div className="px-3 pt-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
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
          "group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/60",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
  const role = useAuthStore((s) => s.tokens?.role);
  const username = useAuthStore((s) => s.tokens?.username);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = role === "ADMIN";
  const notificationsQ = useNotificationsQuery({ page: 1, pageSize: 1 });
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
          <div className="flex items-center justify-between gap-2">
            <div
              className={cn(
                "flex min-w-0 items-center gap-3",
                collapsed && "w-full justify-center"
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
                <span className="text-sm font-semibold text-primary">TF</span>
              </div>

              {!collapsed ? (
                <div className="min-w-0">
                  <div className="text-base font-semibold leading-none">TaskFlow</div>
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
                  className="shrink-0"
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
                  "flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60",
                  collapsed && "w-auto px-2"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials || "U"}</AvatarFallback>
                </Avatar>

                {!collapsed ? (
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium">
                      {username ?? t("common.unknown")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("sidebar.role", { role: role ?? "-" })}
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
