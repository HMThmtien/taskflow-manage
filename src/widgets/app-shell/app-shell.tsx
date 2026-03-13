import { Outlet } from "react-router-dom";
import { Sidebar } from "@/widgets/app-shell/sidebar";
import { Topbar } from "@/widgets/app-shell/topbar";
import { GlobalCommandPalette } from "@/widgets/app-shell/global-command-palette";
import { useState } from "react";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(1000px_circle_at_50%_-20%,hsl(var(--primary)/0.18),transparent_60%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))] text-foreground">
      <GlobalCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="h-full shrink-0 overflow-y-auto border-r bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <Sidebar />
        </aside>

        {/* Main */}
        <div className="flex h-full flex-1 flex-col">
          {/* Topbar (fixed within main column) */}
          <div className="shrink-0 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40">
            <Topbar onOpenCommandPalette={() => setPaletteOpen(true)} />
          </div>

          {/* Scroll content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
