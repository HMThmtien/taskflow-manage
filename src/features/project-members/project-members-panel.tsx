import { useMemo, useState } from "react";
import {
  useAddProjectMemberMutation,
  useMyProjectRoleQuery,
  useProjectMembersQuery,
  useRemoveProjectMemberMutation,
  useUpdateProjectMemberRoleMutation,
} from "@/features/project-members/api/project-members.queries";
import { type ProjectRole, type ProjectMember } from "@/features/project-members/api/project-members.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, User, Eye, Loader2, Trash2, Plus } from "lucide-react";

const roleOptions: { value: ProjectRole; label: string; icon: any; hint: string }[] = [
  { value: "OWNER", label: "Owner", icon: ShieldCheck, hint: "Full control" },
  { value: "ADMIN", label: "Admin", icon: Shield, hint: "Manage members/settings" },
  { value: "MEMBER", label: "Member", icon: User, hint: "Create & edit issues" },
  { value: "VIEWER", label: "Viewer", icon: Eye, hint: "Read only" },
];

function RoleBadge({ role }: { role: ProjectRole }) {
  const r = roleOptions.find((x) => x.value === role);
  const Icon = r?.icon ?? User;
  return (
    <Badge variant="secondary" className="inline-flex items-center gap-1.5">
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

  // Rule UI: OWNER/ADMIN mới được quản lý member
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">Members</div>
            <Badge variant="outline">{membersQ.isLoading ? "…" : rows.length}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Quản lý quyền trong project (OWNER / ADMIN / MEMBER / VIEWER)
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add member
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Add member</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">Username</div>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. hmt2"
                      autoFocus
                    />
                    <div className="text-xs text-muted-foreground">
                      Nhập username để add member (theo API của bạn).
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">Role</div>
                    <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions
                          .filter((r) => r.value !== "OWNER") // thường không cho add OWNER
                          .map((r) => {
                            const Icon = r.icon;
                            return (
                              <SelectItem key={r.value} value={r.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span>{r.label}</span>
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
                    onClick={() => setAddOpen(false)}
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
                        setUsername("");
                        setRole("MEMBER");
                        setAddOpen(false);
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
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Loading */}
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
                <TableHead>User</TableHead>
                <TableHead className="w-[260px]">Role</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((m) => {
                const isMe = myUserId && m.userId === myUserId;

                return (
                  <TableRow key={m.userId} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{m.username}</span>
                        {isMe ? <Badge variant="outline" className="text-xs">you</Badge> : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManage && !disableOwnerChange(m) ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) =>
                            updateRoleMut.mutate({ userId: m.userId, role: v as ProjectRole })
                          }
                        >
                          <SelectTrigger className="w-[240px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions
                              .filter((r) => r.value !== "OWNER") // thường không cho promote OWNER
                              .map((r) => {
                                const Icon = r.icon;
                                return (
                                  <SelectItem key={r.value} value={r.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <span>{r.label}</span>
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
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setRemoveTarget(m);
                            setRemoveOpen(true);
                          }}
                          disabled={removeMut.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
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
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    No members
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