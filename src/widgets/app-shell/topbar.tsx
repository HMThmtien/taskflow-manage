import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        Welcome, <span className="text-foreground">{user?.name ?? "User"}</span>
      </div>

      <Button variant="outline" size="sm" onClick={logout}>
        Logout
      </Button>
    </header>
  );
}
