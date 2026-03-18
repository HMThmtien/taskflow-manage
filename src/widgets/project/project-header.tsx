import { Link } from "react-router-dom";
import { ChevronRight, FolderKanban, Plus, Sparkles } from "lucide-react";
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
    <div className="surface-panel relative overflow-hidden rounded-[28px] border border-white/70 p-6 sm:p-7 dark:border-white/10 dark:bg-[linear-gradient(135deg,hsl(222_24%_17%/0.96),hsl(218_22%_14%/0.92)_55%,hsl(200_34%_16%/0.9)_100%)] dark:shadow-[0_26px_54px_-34px_hsl(0_0%_0%/0.6)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.16),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top_right,_hsl(var(--primary)/0.22),_transparent_62%)] lg:block" />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/app/projects" className="hover:text-foreground">
          {t("common.projects")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{project.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary dark:border-primary/25 dark:bg-primary/15">
              <FolderKanban className="h-3.5 w-3.5" />
              {project.key}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
          {project.archived ? (
            <div className="mt-3">
              <Badge variant="secondary">{t("common.archived")}</Badge>
            </div>
          ) : null}
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-slate-300/85 sm:text-[15px]">
              {project.description ?? t("common.noDescription")}
            </p>
          </div>

          <div className="shrink-0">
            <Button onClick={onNewIssue} className="gap-2 rounded-full px-5 shadow-sm shadow-primary/20 dark:shadow-primary/10">
              <Sparkles className="h-4 w-4" />
              <Plus className="h-4 w-4" />
              {t("common.newIssue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
