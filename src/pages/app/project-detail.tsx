import { useParams } from "react-router-dom";
import { KanbanBoard } from "@/widgets/kanban/kanban-board";
import { useProjectQuery } from "@/features/projects/api/projects.queries";
import { ProjectHeader } from "@/widgets/project/project-header";
import { Button } from "@/components/ui/button";
import { CreateIssueDialog } from "@/widgets/issues/create-issue-dialog";
import { useEffect, useState } from "react";
import { useHotkeys, isTypingTarget } from "@/hooks/use-hotkeys";
import { ProjectMembersPanel } from "@/features/project-members/project-members-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabKey = "board" | "members";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [openCreate, setOpenCreate] = useState(false);
  const [tab, setTab] = useState<TabKey>("board");

  if (!projectId) return null;

  const { data: project, isLoading, isError, error, refetch } = useProjectQuery(projectId);

  // Hotkeys: Esc luôn đóng dialog. N và / chỉ hoạt động ở tab Board.
  useHotkeys((e) => {
    // Esc: đóng create dialog nếu đang mở
    if (e.key === "Escape") {
      if (openCreate) {
        e.preventDefault();
        setOpenCreate(false);
      }
      return;
    }

    // Nếu đang gõ trong input/textarea thì không bắt N và /
    if (isTypingTarget(e.target)) return;

    // Chỉ cho N và / chạy ở Board
    if (tab !== "board") return;

    // N: mở create issue
    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      setOpenCreate(true);
      return;
    }

    // /: focus search
    if (e.key === "/") {
      e.preventDefault();
      const el = document.getElementById("issue-search") as HTMLInputElement | null;
      el?.focus();
      return;
    }
  });

  // Nếu user chuyển qua Members thì đóng dialog tạo issue cho gọn UI
  useEffect(() => {
    if (tab !== "board" && openCreate) setOpenCreate(false);
  }, [tab, openCreate]);

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

  if (!project) return null;

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        onNewIssue={() => {
          setTab("board");
          setOpenCreate(true);
        }}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          {tab === "board" ? (
            <Button onClick={() => setOpenCreate(true)}>New issue</Button>
          ) : null}
        </div>

        <TabsContent value="board" className="mt-6">
          <KanbanBoard projectId={projectId} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="rounded-xl border bg-card p-4">
            <ProjectMembersPanel projectId={projectId} />
          </div>
        </TabsContent>
      </Tabs>

      <CreateIssueDialog projectId={projectId} open={openCreate} onOpenChange={setOpenCreate} />
    </div>
  );
}