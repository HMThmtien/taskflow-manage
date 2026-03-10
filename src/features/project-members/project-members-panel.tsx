import { useEffect, useMemo, useState } from "react";
import {
  useAddProjectMemberMutation,
  useMyProjectRoleQuery,
  useProjectMembersQuery,
  useRemoveProjectMemberMutation,
  useUpdateProjectMemberRoleMutation,
} from "@/features/project-members/api/project-members.queries";
import type { ProjectMember, ProjectRole } from "@/features/project-members/api/project-members.api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { Shield, ShieldCheck, User, Eye, Loader2, Trash2, Plus } from "lucide-react";

import { useAdminUsersAutocompleteQuery } from "../admin-user/api/admin-users.queries";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const roleOptions: { value: ProjectRole; label: string; icon: any; hint: string }[] = [
  { value: "OWNER", label: "Owner", icon: ShieldCheck, hint: "Full control" },
  { value: "ADMIN", label: "Admin", icon: Shield, hint: "Manage members/settings" },
  { value: "MEMBER", label: "Member", icon: User, hint: "Create & edit issues" },
  { value: "VIEWER", label: "Viewer", icon: Eye, hint: "Read only" },
];

function RoleBadge({ role }: { role: ProjectRole }) {
  const r = roleOptions.find((x) => x.value === role);
  const Icon = r?.icon ?? User;

  const variant =
    role === "OWNER" ? "destructive" : role === "ADMIN" ? "default" : role === "MEMBER" ? "secondary" : "outline";

  return (
    <Badge variant={variant as any} className="inline-flex items-center gap-1.5 font-medium">
      <Icon className="h-3.5 w-3.5" />
      {role}
    </Badge>
  );
}

export function ProjectMembersPanel({ projectId }: { projectId: string }) {
  const { toast } = useToast();

  const membersQ = useProjectMembersQuery(projectId);
  const myRoleQ = useMyProjectRoleQuery(projectId);

  const addMut = useAddProjectMemberMutation(projectId);
  const updateRoleMut = useUpdateProjectMemberRoleMutation(projectId);
  const removeMut = useRemoveProjectMemberMutation(projectId);

  const myRole = myRoleQ.data?.role;
  const myUserId = myRoleQ.data?.userId;

  // OWNER/ADMIN mới được quản lý member
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");

  // search (autocomplete)
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const usersQ = useAdminUsersAutocompleteQuery(addOpen ? debounced : "");
  const users = usersQ.data?.content ?? [];

  const resetAddForm = () => {
    setUsername("");
    setSearch("");
    setDebounced("");
    setRole("MEMBER");
  };

  // Remove dialog
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);

  const members = membersQ.data ?? [];

  const rows = useMemo(() => {
    const order: Record<ProjectRole, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2, VIEWER: 3 };
    return [...members].sort((a, b) => order[a.role] - order[b.role] || a.username.localeCompare(b.username));
  }, [members]);

  const disableOwnerChange = (m: ProjectMember) => m.role === "OWNER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Project Members</h2>
            <Badge variant="secondary">{membersQ.isLoading ? "…" : rows.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Manage access levels and permissions within this project.</p>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <Dialog
              open={addOpen}
              onOpenChange={(open) => {
                setAddOpen(open);
                if (!open) resetAddForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add member
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[760px] md:max-w-[860px] max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Add member</DialogTitle>
                </DialogHeader>

                {/* Body scroll (prevents dialog jumping) */}
                <div className="space-y-5 max-h-[calc(80vh-120px)] overflow-y-auto pr-1">
                  {/* Username autocomplete */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Username</div>

                    <Card className="p-0 overflow-hidden">
                      <Command shouldFilter={false}>
                        <CommandInput
                          value={search}
                          onValueChange={(v) => {
                            setSearch(v);
                            setUsername(v); // free text allowed
                          }}
                          placeholder="Type username to search…"
                        />

                        {/* fixed height -> no layout shift */}
                        <CommandList className="h-[260px] overflow-y-auto">
                          {!search.trim() ? (
                            <div className="p-3 text-sm text-muted-foreground">Start typing to search users…</div>
                          ) : null}

                          {usersQ.isLoading ? (
                            <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : null}

                          {debounced.trim() ? <CommandEmpty>No users found</CommandEmpty> : null}

                          {users.map((u) => (
                            <CommandItem
                              key={u.id ?? u.username}
                              value={u.username}
                              onSelect={() => {
                                setUsername(u.username);
                                setSearch(u.username);
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

                    {username.trim() ? (
                      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between">
                        <span className="text-muted-foreground">Selected</span>
                        <span className="font-medium truncate">{username.trim()}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Enter a username to add (server-side search).
                      </div>
                    )}
                  </div>

                  {/* Role select */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Role</div>
                    <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions
                          .filter((r) => r.value !== "OWNER") // usually don't allow adding OWNER
                          .map((r) => {
                            const Icon = r.icon;
                            return (
                              <SelectItem key={r.value} value={r.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{r.label}</span>
                                    <span className="text-xs text-muted-foreground">{r.hint}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddOpen(false);
                      resetAddForm();
                    }}
                    disabled={addMut.isPending}
                  >
                    Cancel
                  </Button>

                  <Button
                    disabled={addMut.isPending}
                    onClick={async () => {
                      try {
                        const u = username.trim();
                        if (!u) {
                          toast({
                            title: "Invalid",
                            description: "Username không được trống",
                            variant: "destructive",
                          });
                          return;
                        }
                        await addMut.mutateAsync({ username: u, role });
                        toast({ title: "Added" });
                        setAddOpen(false);
                        resetAddForm();
                      } catch (e: any) {
                        toast({
                          title: "Add failed",
                          description: e?.message ?? "Unknown error",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {addMut.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Badge variant="outline">Read-only</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {membersQ.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading members...
          </div>
        ) : membersQ.isError ? (
          <div className="p-6 text-sm text-destructive">
            {(membersQ.error as Error)?.message ?? "Failed to load members"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[360px]">User</TableHead>
                <TableHead className="w-[200px]">Role</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((m) => {
                const isMe = myUserId && m.userId === myUserId;

                return (
                  <TableRow key={m.userId} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{m.username}</span>
                        {isMe ? (
                          <Badge variant="outline" className="text-xs">
                            you
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManage && !disableOwnerChange(m) ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) => updateRoleMut.mutate({ userId: m.userId, role: v as ProjectRole })}
                        >
                          <SelectTrigger className="w-[240px] h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions
                              .filter((r) => r.value !== "OWNER") // usually don't allow promote OWNER
                              .map((r) => {
                                const Icon = r.icon;
                                return (
                                  <SelectItem key={r.value} value={r.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{r.label}</span>
                                        <span className="text-xs text-muted-foreground">{r.hint}</span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {canManage && !disableOwnerChange(m) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setRemoveTarget(m);
                            setRemoveOpen(true);
                          }}
                          disabled={removeMut.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <User className="h-6 w-6 opacity-40" />
                      <p className="text-sm font-medium">No members yet</p>
                      <p className="text-xs">Add team members to collaborate on this project.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Remove confirm */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{removeTarget?.username}</span> from this project?
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removeMut.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMut.isPending || !removeTarget}
              onClick={async () => {
                if (!removeTarget) return;
                try {
                  await removeMut.mutateAsync(removeTarget.userId);
                  toast({ title: "Removed" });
                  setRemoveOpen(false);
                  setRemoveTarget(null);
                } catch (e: any) {
                  toast({
                    title: "Remove failed",
                    description: e?.message ?? "Unknown error",
                    variant: "destructive",
                  });
                }
              }}
            >
              {removeMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}