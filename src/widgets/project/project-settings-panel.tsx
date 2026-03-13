import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/features/projects/api/projects.api";
import {
  useArchiveProjectMutation,
  useDeleteProjectMutation,
  useUnarchiveProjectMutation,
  useUpdateProjectMutation,
} from "@/features/projects/api/projects.queries";
import { useMyProjectRoleQuery } from "@/features/project-members/api/project-members.queries";

function normalizeProjectKey(value: string) {
  return value.trim().toUpperCase();
}

export function ProjectSettingsPanel({ project }: { project: Project }) {
  const nav = useNavigate();
  const { toast } = useToast();
  const roleQ = useMyProjectRoleQuery(project.id);

  const updateMut = useUpdateProjectMutation(project.id);
  const archiveMut = useArchiveProjectMutation(project.id);
  const unarchiveMut = useUnarchiveProjectMutation(project.id);
  const deleteMut = useDeleteProjectMutation(project.id);

  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [description, setDescription] = useState(project.description ?? "");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setName(project.name);
    setKey(project.key);
    setDescription(project.description ?? "");
  }, [project.description, project.key, project.name]);

  const role = roleQ.data?.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const canDelete = role === "OWNER";

  const dirty = useMemo(() => {
    return (
      name.trim() !== project.name ||
      normalizeProjectKey(key) !== project.key ||
      description.trim() !== (project.description ?? "")
    );
  }, [description, key, name, project.description, project.key, project.name]);

  async function handleSave() {
    try {
      const normalizedKey = normalizeProjectKey(key);
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();

      await updateMut.mutateAsync({
        key: normalizedKey,
        name: trimmedName,
        description: trimmedDescription || undefined,
      });
      setKey(normalizedKey);
      setName(trimmedName);
      setDescription(trimmedDescription);
      toast({ title: "Project updated" });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleArchiveToggle() {
    try {
      if (project.archived) {
        await unarchiveMut.mutateAsync();
        toast({ title: "Project unarchived" });
      } else {
        await archiveMut.mutateAsync();
        toast({ title: "Project archived" });
      }
      setArchiveOpen(false);
    } catch (e: any) {
      toast({
        title: project.archived ? "Unarchive failed" : "Archive failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync();
      toast({ title: "Project deleted" });
      nav("/app/projects", { replace: true });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Project Settings</CardTitle>
            {project.archived ? <Badge variant="secondary">Archived</Badge> : null}
          </div>
          <CardDescription>
            Manage the project identity and lifecycle while keeping the rest of the project flows intact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage ? (
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Only project admins and owners can update these settings.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Project name</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManage || updateMut.isPending}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Project key</div>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={() => setKey((current) => normalizeProjectKey(current))}
                disabled={!canManage || updateMut.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Description</div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[140px]"
              disabled={!canManage || updateMut.isPending}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Project code preview: <span className="font-medium text-foreground">{normalizeProjectKey(key) || "KEY"}</span>
            </div>
            <Button onClick={handleSave} disabled={!canManage || !dirty || updateMut.isPending}>
              {updateMut.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            These actions affect the whole project, so they require explicit confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="font-medium">{project.archived ? "Unarchive project" : "Archive project"}</div>
                <div className="text-sm text-muted-foreground">
                  {project.archived
                    ? "Make this project active again."
                    : "Mark this project as archived while keeping its history available."}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setArchiveOpen(true)}
                disabled={!canManage || archiveMut.isPending || unarchiveMut.isPending}
              >
                {project.archived ? "Unarchive" : "Archive"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="font-medium text-destructive">Delete project</div>
                <div className="text-sm text-muted-foreground">
                  Permanently remove the project and all related project data.
                </div>
              </div>

              <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={!canDelete || deleteMut.isPending}>
                Delete project
              </Button>
            </div>
            {!canDelete ? (
              <div className="mt-3 text-xs text-muted-foreground">Only the project owner can delete this project.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{project.archived ? "Unarchive project?" : "Archive project?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {project.archived
                ? "This project will become active again."
                : "This project will be marked as archived. You can restore it later from settings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMut.isPending || unarchiveMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveMut.isPending || unarchiveMut.isPending}
              onClick={handleArchiveToggle}
            >
              {archiveMut.isPending || unarchiveMut.isPending
                ? (project.archived ? "Unarchiving..." : "Archiving...")
                : (project.archived ? "Unarchive" : "Archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All issues, members, comments, attachments, and related records under this project will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleteMut.isPending} onClick={handleDelete}>
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
