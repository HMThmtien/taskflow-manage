import { useEffect, useState } from "react";
import { BookmarkPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Project } from "@/features/projects/api/projects.api";
import type { ReportView } from "@/features/report-views/api/report-views.api";

export function ReportViewToolbar({
  title,
  description,
  views,
  projects,
  selectedProjectId,
  saving,
  deletingId,
  onSelectProjectId,
  onCreateView,
  onDeleteView,
}: {
  title: string;
  description: string;
  views: ReportView[];
  projects: Project[];
  selectedProjectId: string;
  saving: boolean;
  deletingId?: string | null;
  onSelectProjectId: (projectId: string) => void;
  onCreateView: (payload: { name: string; isDefault: boolean }) => void;
  onDeleteView: (reportViewId: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!dialogOpen) {
      setName("");
      setIsDefault(false);
    }
  }, [dialogOpen]);

  const safeViews = Array.isArray(views) ? views : [];

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {safeViews.map((view) => {
              const project = projects.find((item) => item.id === view.projectId);
              const active = selectedProjectId === view.projectId;

              return (
                <div key={view.id} className="flex items-center gap-1">
                  <Button
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectProjectId(view.projectId)}
                  >
                    {view.name}
                    {project ? ` · ${project.key}` : ""}
                    {view.isDefault ? " · Default" : ""}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteView(view.id)}
                    disabled={deletingId === view.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            <Button variant="outline" onClick={() => setDialogOpen(true)} disabled={!selectedProjectId}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Save view
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekly management view"
            />

            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={isDefault} onCheckedChange={(checked) => setIsDefault(!!checked)} />
              Make this the default saved view
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onCreateView({ name, isDefault });
                setDialogOpen(false);
              }}
              disabled={saving || name.trim().length < 2}
            >
              {saving ? "Saving..." : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
