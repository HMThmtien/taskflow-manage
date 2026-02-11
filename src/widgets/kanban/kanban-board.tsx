
import { useMemo, useState } from "react";
import { type Issue, type IssueStatus } from "@/features/issues/api/issues.api";
import { useIssuesQuery, useMoveIssueMutation } from "@/features/issues/api/issues.queries";
import { KanbanColumn } from "./kanban-column";
import { IssueDrawer } from "./issue-drawer";
import { useHotkeys, isTypingTarget } from "@/hooks/use-hotkeys";
import { IssueFilterBar } from "@/widgets/issues/issue-filter-bar";
import { useIssueFilters } from "@/features/issues/api/use-issue-filters";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/pages/app/status-pill";
import { PriorityBadge } from "@/pages/app/priority-badge";

const columns: { key: IssueStatus; title: string }[] = [
  { key: "todo", title: "Todo" },
  { key: "in_progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, error, refetch } = useIssuesQuery(projectId);
  const moveMut = useMoveIssueMutation(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  
  const activeIssue = useMemo(() => {
    if (!activeId) return null;
    return (data ?? []).find((i) => i.id === activeId) ?? null;
  }, [activeId, data]);
  
  const [selected, setSelected] = useState<Issue | null>(null);
  useHotkeys((e) => {
    if (e.key !== "Escape") return;
  
    // đang gõ trong input/textarea (ví dụ trong Drawer) thì cho Esc hoạt động bình thường:
    // nhưng ở đây Esc dùng để đóng drawer vẫn ok, mình vẫn cho chạy
    e.preventDefault();
    if (selected) setSelected(null);
  });
  
  const { filters } = useIssueFilters();

  const issuesList = data ?? [];

  const filteredIssues = useMemo(() => {
    const q = filters.q?.trim().toLowerCase();
    return issuesList.filter((issue) => {
      if (q && !issue.title.toLowerCase().includes(q)) return false;
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      return true;
    });
  }, [issuesList, filters.q, filters.status, filters.priority]);

  const grouped = useMemo(() => {
    return {
      todo: filteredIssues.filter((i) => i.status === "todo"),
      in_progress: filteredIssues.filter((i) => i.status === "in_progress"),
      done: filteredIssues.filter((i) => i.status === "done"),
    };
  }, [filteredIssues]);

  // function onDragEnd(e: DragEndEvent) {
  //   const issueId = String(e.active.id);
  //   const overId = e.over?.id ? String(e.over.id) : null;
  //   if (!overId) return;

  //   const nextStatus = overId as IssueStatus;
  //   const current = (data ?? []).find((i) => i.id === issueId);
  //   if (!current || current.status === nextStatus) return;

  //   moveMut.mutate({ issueId, status: nextStatus });
  // }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragCancel() {
    setActiveId(null);
  }
  
  
  function onDragEnd(e: DragEndEvent) {
    const issueId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
  
    setActiveId(null);
  
    if (!overId) return;
    const nextStatus = overId as IssueStatus;
    const current = (data ?? []).find((i) => i.id === issueId);
    if (!current || current.status === nextStatus) return;
  
    moveMut.mutate({ issueId, status: nextStatus });
  }
  

  // ✅ Skeleton loading (giữ như bạn đang làm)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full max-w-[720px] rounded bg-muted animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[520px] rounded-lg border bg-card">
              <div className="p-4">
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="h-16 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Error state polish
  if (isError) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">{(error as Error).message}</div>
        <Button variant="outline" onClick={() => refetch()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const isEmptyAfterFilter = filteredIssues.length === 0;

  return (
    <>
      <IssueFilterBar />

      {isEmptyAfterFilter ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <div className="text-sm font-medium">No issues found</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Try clearing filters or create a new issue.
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((c) => (
              <KanbanColumn
                key={c.key}
                id={c.key}
                title={c.title}
                items={grouped[c.key]}
                onSelect={(it) => setSelected(it)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeIssue ? (
              <div className="w-[320px]">
                {/* reuse IssueCard UI nhưng không gắn draggable */}
                <Card className="p-3 shadow-lg">
                  <div className="text-sm font-medium">{activeIssue.title}</div>
                  <div className="mt-2 flex gap-2">
                    <StatusPill status={activeIssue.status} />
                    <PriorityBadge priority={activeIssue.priority} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {activeIssue.description?.trim() ? activeIssue.description : "No description"}
                  </div>
                </Card>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <IssueDrawer
        projectId={projectId}
        issue={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}
