import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  useAdminUsersAutocompleteQuery,
  useChangeUserRoleMutation,
} from "@/features/admin-user/api/admin-users.queries";
import type { GlobalRole } from "@/features/admin-user/api/admin-users.api";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const roleOptions: { value: GlobalRole; label: string; hint: string }[] = [
  { value: "USER", label: "USER", hint: "Normal user" },
  { value: "ADMIN", label: "ADMIN", hint: "System administrator" },
];

function RolePill({ role }: { role: GlobalRole | "UNKNOWN" }) {
  const variant = role === "ADMIN" ? "destructive" : role === "USER" ? "secondary" : "outline";
  return (
    <Badge variant={variant as any} className="font-medium">
      {role === "UNKNOWN" ? "Unknown" : role}
    </Badge>
  );
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const mut = useChangeUserRoleMutation();

  // input state
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<GlobalRole>("USER");

  // current role of selected user (from autocomplete result)
  const [currentRole, setCurrentRole] = useState<GlobalRole | "UNKNOWN">("UNKNOWN");

  // search (autocomplete)
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ✅ debounce 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const usersQ = useAdminUsersAutocompleteQuery(debounced);
  const users = usersQ.data?.content ?? [];

  // ✅ TODO: thay bằng flag từ backend (ví dụ: myRoleQ.data?.role === "SUPER_ADMIN")
  // Nếu user không có quyền cấp ADMIN => disable option ADMIN
  const canGrantAdmin = true;

  const roleHint = useMemo(() => roleOptions.find((r) => r.value === role)?.hint ?? "", [role]);

  const disabledApply = mut.isPending || !username.trim() || (role === "ADMIN" && !canGrantAdmin);

  const reset = () => {
    setUsername("");
    setSearch("");
    setDebounced("");
    setRole("USER");
    setCurrentRole("UNKNOWN");
  };

  const doApply = async () => {
    const u = username.trim();
    if (!u) {
      toast({ title: "Invalid", description: "Username không được trống", variant: "destructive" });
      return;
    }

    if (role === "ADMIN" && !canGrantAdmin) {
      toast({ title: "Forbidden", description: "Bạn không có quyền cấp ADMIN", variant: "destructive" });
      return;
    }

    try {
      await mut.mutateAsync({ username: u, role });
      toast({ title: "Updated", description: `${u} → ${role}` });
      reset();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onClickApply = async () => {
    const u = username.trim();
    if (!u) return;

    // ✅ Confirm only when promoting to ADMIN (high-risk)
    const isPromoteToAdmin = role === "ADMIN" && currentRole !== "ADMIN";
    if (isPromoteToAdmin) {
      setConfirmOpen(true);
      return;
    }
    await doApply();
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Admin · User Roles</h1>
          <Badge variant="outline" className="ml-1">
            Security
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Search a user, review their current role, and apply a new role.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          {/* User search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">User</div>
              {usersQ.isFetching ? (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching…
                </div>
              ) : null}
            </div>

            <Card className="p-0 overflow-hidden">
              <Command shouldFilter={false}>
                <CommandInput
                  value={search}
                  onValueChange={(v) => {
                    setSearch(v);
                    setUsername(v); // ✅ allow free text
                    setCurrentRole("UNKNOWN"); // typing => unknown
                  }}
                  placeholder="Type username to search…"
                />

                {/* fixed height => no layout jumping */}
                <CommandList className="h-[260px] overflow-y-auto">
                  {!search.trim() ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Start typing to search users…
                    </div>
                  ) : null}

                  {usersQ.isLoading ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </div>
                  ) : null}

                  {debounced.trim() ? <CommandEmpty>No users found</CommandEmpty> : null}

                  {users.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={u.username}
                      onSelect={() => {
                        setUsername(u.username);
                        setSearch(u.username);
                        setCurrentRole(u.role); // ✅ store current role
                        setRole(u.role); // ✅ autofill new role = current role (optional)
                      }}
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        <span className="truncate font-medium">{u.username}</span>
                        <Badge variant={u.role === "ADMIN" ? "destructive" : "secondary"} className="shrink-0">
                          {u.role}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </Card>

            {/* Selected preview */}
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Selected</span>
                <span className="font-medium truncate">{username.trim() || "—"}</span>
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Role</div>

            <div className="rounded-xl border p-4 space-y-3">
              <Select value={role} onValueChange={(v) => setRole(v as GlobalRole)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>

                <SelectContent>
                  {roleOptions.map((r) => {
                    const isAdmin = r.value === "ADMIN";
                    const disabled = isAdmin && !canGrantAdmin;

                    return (
                      <SelectItem key={r.value} value={r.value} disabled={disabled}>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {disabled ? "You don't have permission to grant ADMIN" : r.hint}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Current -> New */}
              <div className="rounded-lg border bg-background px-3 py-2">
                <div className="text-xs text-muted-foreground mb-2">Change preview</div>
                <div className="flex items-center gap-2 text-sm">
                  <RolePill role={currentRole} />
                  <span className="text-muted-foreground">→</span>
                  <RolePill role={role} />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {roleHint ? (
                  <>
                    <span className="font-medium text-foreground">{role}</span> — {roleHint}
                  </>
                ) : (
                  "Choose a role for the selected user."
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Tip: Selecting a user auto-fills their current role.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t pt-5">
          <Button variant="outline" onClick={reset} disabled={mut.isPending}>
            Reset
          </Button>

          <Button className="min-w-[200px]" disabled={disabledApply} onClick={onClickApply}>
            {mut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply changes"
            )}
          </Button>
        </div>
      </Card>

      {/* Confirm promote to ADMIN */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm admin access</AlertDialogTitle>
            <AlertDialogDescription>
              You’re about to grant <span className="font-medium text-foreground">ADMIN</span> role to{" "}
              <span className="font-medium text-foreground">{username.trim() || "this user"}</span>.
              This gives elevated permissions and should be done carefully.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <div className="text-xs text-muted-foreground mb-2">Change preview</div>
            <div className="flex items-center gap-2">
              <RolePill role={currentRole} />
              <span className="text-muted-foreground">→</span>
              <RolePill role="ADMIN" />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={mut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mut.isPending}
              onClick={async () => {
                setConfirmOpen(false);
                await doApply();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}