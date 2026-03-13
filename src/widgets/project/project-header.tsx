import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";
import type { Project } from "@/features/projects/api/projects.api";

export function ProjectHeader({
  project,
  onNewIssue,
}: {
  project: Project;
  onNewIssue: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/app/projects" className="hover:text-foreground">
          {t("common.projects")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{project.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {project.name} <span className="text-muted-foreground">({project.key})</span>
          </h1>
          {project.archived ? (
            <div className="mt-2">
              <Badge variant="secondary">{t("common.archived")}</Badge>
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {project.description ?? t("common.noDescription")}
          </p>
        </div>

        <div className="shrink-0">
          <Button onClick={onNewIssue} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("common.newIssue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
