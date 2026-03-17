import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { KanbanBoard } from "@/widgets/kanban/kanban-board";
import { useProjectQuery } from "@/features/projects/api/projects.queries";
import { ProjectHeader } from "@/widgets/project/project-header";
import { ProjectBacklogPanel } from "@/widgets/project/project-backlog-panel";
import { ProjectSettingsPanel } from "@/widgets/project/project-settings-panel";
import { Button } from "@/components/ui/button";
import { CreateIssueDialog } from "@/widgets/issues/create-issue-dialog";
import { useHotkeys, isTypingTarget } from "@/hooks/use-hotkeys";
import { ProjectMembersPanel } from "@/features/project-members/project-members-panel";
import { useI18n } from "@/features/i18n/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, Keyboard } from "lucide-react";
import { useProjectSummaryReportQuery } from "@/features/reports/api/reports.queries";
import { ProjectOverviewCard } from "@/widgets/project/project-overview-card";

type TabKey = "board" | "backlog" | "members" | "settings";

function normalizeTab(v: string | null): TabKey {
  if (v === "backlog") return "backlog";
  if (v === "members") return "members";
  if (v === "settings") return "settings";
  return "board";
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();

  const tabFromUrl = useMemo(() => normalizeTab(params.get("tab")), [params]);
  const issueIdFromUrl = params.get("issueId");
  const [tab, setTab] = useState<TabKey>(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const [openCreate, setOpenCreate] = useState(false);

  const safeProjectId = projectId ?? "";
  const { data: project, isLoading, isError, error, refetch, isFetching } =
    useProjectQuery(safeProjectId);
  const summaryQ = useProjectSummaryReportQuery(projectId);

  useHotkeys((e) => {
    if (e.key === "Escape") {
      if (openCreate) {
        e.preventDefault();
        setOpenCreate(false);
      }
      return;
    }

    if (isTypingTarget(e.target)) return;
    if (tab !== "board" && tab !== "backlog") return;

    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      setOpenCreate(true);
      return;
    }

    if (tab !== "board") return;

    if (e.key === "/") {
      e.preventDefault();
      const el = document.getElementById("issue-search") as HTMLInputElement | null;
      el?.focus();
    }
  });

  useEffect(() => {
    if (tab !== "board" && openCreate) setOpenCreate(false);
  }, [tab, openCreate]);

  if (!projectId) return null;

  function setTabAndUrl(next: TabKey) {
    setTab(next);
    const p = new URLSearchParams(params);
    p.set("tab", next);
    setParams(p, { replace: true });
  }

  function setSelectedIssueId(nextIssueId: string | null) {
    const p = new URLSearchParams(params);
    if (nextIssueId) {
      p.set("issueId", nextIssueId);
      p.set("tab", "board");
    } else {
      p.delete("issueId");
    }
    setParams(p, { replace: true });
  }

  if (isError) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("project.failedToLoad")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {(error as Error)?.message ?? "Unknown error"}
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-[520px] shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((__, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        onNewIssue={() => {
          setTabAndUrl("board");
          setOpenCreate(true);
        }}
      />

      {summaryQ.data ? (
        <ProjectOverviewCard
          summary={summaryQ.data}
          title={t("project.overviewTitle")}
          description={t("project.overviewDescription")}
        />
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTabAndUrl(v as TabKey)} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="board">{t("project.tabs.board")}</TabsTrigger>
            <TabsTrigger value="backlog">{t("project.tabs.backlog")}</TabsTrigger>
            <TabsTrigger value="members">{t("project.tabs.members")}</TabsTrigger>
            <TabsTrigger value="settings">{t("project.tabs.settings")}</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {tab === "board" || tab === "backlog" ? (
              <>
                {tab === "board" ? (
                  <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-2">
                    <Keyboard className="h-4 w-4" />
                    <span>{t("project.shortcuts.label")}</span>
                  </div>
                ) : null}

                <Button onClick={() => setOpenCreate(true)} className="whitespace-nowrap">
                  {t("common.newIssue")}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <TabsContent value="board" className="mt-6">
          <KanbanBoard
            projectId={projectId}
            projectKey={project.key}
            onCreateIssue={() => setOpenCreate(true)}
            selectedIssueId={issueIdFromUrl}
            onSelectedIssueChange={setSelectedIssueId}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <ProjectMembersPanel projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <ProjectBacklogPanel
            projectId={projectId}
            onCreateIssue={() => setOpenCreate(true)}
            selectedIssueId={issueIdFromUrl}
            onSelectedIssueChange={setSelectedIssueId}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ProjectSettingsPanel project={project} />
        </TabsContent>
      </Tabs>

      {tab === "board" || tab === "backlog" ? (
        <CreateIssueDialog
          projectId={projectId}
          open={openCreate}
          onOpenChange={setOpenCreate}
        />
      ) : null}
    </div>
  );
}
