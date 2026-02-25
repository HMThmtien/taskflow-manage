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
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

const roleOptions: { value: GlobalRole; label: string; hint: string }[] = [
  { value: "USER", label: "USER", hint: "Normal user" },
  { value: "ADMIN", label: "ADMIN", hint: "System administrator" },
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const mut = useChangeUserRoleMutation();

  // input state
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<GlobalRole>("USER");

  // search (autocomplete)
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // ✅ debounce 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const usersQ = useAdminUsersAutocompleteQuery(debounced);
  const users = usersQ.data?.content ?? [];

  const disabled = mut.isPending;
  const roleHint = useMemo(() => roleOptions.find((r) => r.value === role)?.hint ?? "", [role]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Admin · User Roles</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Promote/Demote user bằng username (PATCH /api/admin/users/&lt;username&gt;/role?role=...)
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Username autocomplete */}
          <div className="space-y-1.5 md:col-span-1">
            <div className="text-xs font-medium text-muted-foreground">Username</div>

            <Card className="p-0 overflow-hidden">
              {/* server-side search => shouldFilter={false} */}
              <Command shouldFilter={false}>
                <CommandInput
                  value={search}
                  onValueChange={(v) => {
                    setSearch(v);
                    setUsername(v); // ✅ vẫn cho nhập tự do
                  }}
                  placeholder="Type username to search…"
                />

                <CommandList className="max-h-[260px] overflow-y-auto">
                  {usersQ.isLoading ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : null}

                  {/* chỉ hiện empty khi đã gõ */}
                  {debounced.trim() ? <CommandEmpty>No users found</CommandEmpty> : null}

                  {users.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={u.username}
                      onSelect={() => {
                        setUsername(u.username);
                        setSearch(u.username);
                        setRole(u.role); // ✅ tiện: chọn user tự fill role hiện tại
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{u.username}</span>
                        <span className="text-xs text-muted-foreground">{u.role}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </Card>

            <div className="text-xs text-muted-foreground">
              Chọn từ danh sách hoặc gõ thẳng username (list giới hạn 15).
            </div>
          </div>

          {/* Role select */}
          <div className="space-y-1.5 md:col-span-1">
            <div className="text-xs font-medium text-muted-foreground">Role</div>
            <Select value={role} onValueChange={(v) => setRole(v as GlobalRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.hint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">{roleHint}</div>
          </div>

          {/* Apply */}
          <div className="flex items-end md:col-span-1">
            <Button
              className="w-full"
              disabled={disabled}
              onClick={async () => {
                const u = username.trim();
                if (!u) {
                  toast({ title: "Invalid", description: "Username không được trống", variant: "destructive" });
                  return;
                }

                try {
                  await mut.mutateAsync({ username: u, role });
                  toast({ title: "Updated", description: `${u} → ${role}` });
                  // giữ search lại cũng được, nhưng mình reset cho sạch
                  setUsername("");
                  setSearch("");
                  setRole("USER");
                } catch (e: any) {
                  toast({
                    title: "Update failed",
                    description: e?.message ?? "Unknown error",
                    variant: "destructive",
                  });
                }
              }}
            >
              {mut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: gõ “hm” sẽ gọi list users, pick user rồi đổi role cực nhanh.
        </div>
      </Card>
    </div>
  );
}