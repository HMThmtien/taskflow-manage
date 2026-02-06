import { Outlet } from "react-router-dom";
import { Sidebar } from "@/widgets/app-shell/sidebar";
import { Topbar } from "@/widgets/app-shell/topbar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
