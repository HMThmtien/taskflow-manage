import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-card/40 p-4 md:block">
      <div className="mb-6">
        <div className="text-lg font-semibold">TaskFlow</div>
        <div className="text-xs text-muted-foreground">SaaS Dashboard</div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                  isActive && "bg-accent"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
