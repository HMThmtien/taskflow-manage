import { Outlet } from "react-router-dom";
import { Sidebar } from "@/widgets/app-shell/sidebar";
import { Topbar } from "@/widgets/app-shell/topbar";
import { GlobalCommandPalette } from "@/widgets/app-shell/global-command-palette";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { useRealtimeEvents } from "@/features/realtime/use-realtime-events";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useRealtimeEvents();

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(135deg,hsl(152_44%_96%)_0%,hsl(42_58%_97%)_28%,hsl(194_48%_96%)_68%,hsl(36_62%_98%)_100%)] text-foreground dark:bg-[linear-gradient(145deg,hsl(222_30%_10%)_0%,hsl(214_28%_11%)_38%,hsl(204_32%_12%)_68%,hsl(228_26%_10%)_100%)]">
      <GlobalCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="h-full shrink-0 overflow-y-auto border-r border-white/60 bg-[linear-gradient(180deg,hsl(155_32%_94%/0.96),hsl(189_34%_95%/0.92)_46%,hsl(44_58%_96%/0.92)_100%)] backdrop-blur supports-[backdrop-filter]:bg-[linear-gradient(180deg,hsl(155_32%_94%/0.78),hsl(189_34%_95%/0.72)_46%,hsl(44_58%_96%/0.72)_100%)] dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(220_24%_14%/0.96),hsl(208_28%_13%/0.92)_42%,hsl(222_20%_12%/0.94)_100%)] dark:supports-[backdrop-filter]:bg-[linear-gradient(180deg,hsl(220_24%_14%/0.82),hsl(208_28%_13%/0.76)_42%,hsl(222_20%_12%/0.78)_100%)]">
          <Sidebar />
        </aside>

        {/* Main */}
        <div className="flex h-full flex-1 flex-col">
          {/* Topbar (fixed within main column) */}
          <div className="shrink-0 border-b border-white/60 bg-[linear-gradient(180deg,hsl(0_0%_100%/0.78),hsl(48_52%_98%/0.56))] backdrop-blur supports-[backdrop-filter]:bg-[linear-gradient(180deg,hsl(0_0%_100%/0.6),hsl(48_52%_98%/0.36))] dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(222_22%_18%/0.86),hsl(216_22%_16%/0.68))] dark:supports-[backdrop-filter]:bg-[linear-gradient(180deg,hsl(222_22%_18%/0.74),hsl(216_22%_16%/0.54))]">
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
