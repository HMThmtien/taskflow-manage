import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/api/projects.api";

export function ProjectHeader({
  project,
  onNewIssue,
}: {
  project: Project;
  onNewIssue: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/app/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {project.name} <span className="text-muted-foreground">({project.key})</span>
          </h1>
          <p className="text-sm text-muted-foreground">{project.description ?? "No description"}</p>
        </div>

        <div className="shrink-0">
          <Button onClick={onNewIssue} className="gap-2">
            <Plus className="h-4 w-4" />
            New issue
          </Button>
        </div>
      </div>
    </div>
  );
}
