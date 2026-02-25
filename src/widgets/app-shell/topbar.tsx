import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

export function Topbar() {
  const tokens = useAuthStore((s) => s.tokens);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        Welcome,{" "}
        <span className="text-foreground">
          {tokens?.username ?? ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs rounded-md bg-muted px-2 py-1">
          {tokens?.role}
        </span>

        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}