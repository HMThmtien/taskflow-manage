import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/widgets/kanban/kanban-board";
import { useProjectQuery } from "@/features/projects/api/projects.queries";
import { ProjectHeader } from "@/widgets/project/project-header";
import { Button } from "@/components/ui/button";
import { CreateIssueDialog } from "@/widgets/issues/create-issue-dialog";
import { useState } from "react";

export default function ProjectDetailPage() {

  const [openCreate, setOpenCreate] = useState(false);
  const { projectId } = useParams();
  if (!projectId) return null;

  const { data: project, isLoading, isError, error, refetch } = useProjectQuery(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[520px] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">{(error as Error).message}</div>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        onNewIssue={() => {
          setOpenCreate(true);
        }}
      />

      <KanbanBoard projectId={projectId} />

      <CreateIssueDialog
        projectId={projectId}
        open={openCreate}
        onOpenChange={setOpenCreate}
      />
    </div>
  );
}
