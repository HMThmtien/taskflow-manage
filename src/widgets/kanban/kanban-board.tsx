import { useEffect, useMemo, useState } from "react";
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
import { useProjectMembersQuery } from "@/features/project-members/api/project-members.queries";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/pages/app/status-pill";
import { PriorityBadge } from "@/pages/app/priority-badge";

const columns: { key: IssueStatus; title: string }[] = [
  { key: "TODO", title: "Todo" },
  { key: "IN_PROGRESS", title: "In Progress" },
  { key: "DONE", title: "Done" },
];

type SortBy = "position" | "priority" | "dueDate" | "updatedAt";

function priorityRank(p: Issue["priority"]) {
  return p === "HIGH" ? 0 : p === "MEDIUM" ? 1 : 2;
}

function safeTime(v?: string | null) {
  if (!v) return Number.POSITIVE_INFINITY;
  const d = new Date(v);
  const t = d.getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export function KanbanBoard({
  projectId,
  projectKey,
  onCreateIssue,
  selectedIssueId,
  onSelectedIssueChange,
}: {
  projectId: string;
  projectKey: string;
  onCreateIssue?: () => void;
  selectedIssueId?: string | null;
  onSelectedIssueChange?: (issueId: string | null) => void;
}) {
  const { filters } = useIssueFilters();

  // ✅ add isFetching so you can show "Updating..."
  const { data, isLoading, isFetching, isError, error, refetch } = useIssuesQuery(projectId, filters);

  const moveMut = useMoveIssueMutation(projectId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Issue | null>(null);

  // Optimistic overrides (avoid syncing state from effects)
  const [overrides, setOverrides] = useState<Record<string, Partial<Issue>>>({});

  const membersQ = useProjectMembersQuery(projectId);
  const members = membersQ.data?.map((m) => ({ userId: m.userId, username: m.username })) ?? [];
  const memberNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of members) m.set(it.userId, it.username);
    return m;
  }, [members]);

  // Board preferences (local only)
  const [sortBy, setSortBy] = useState<SortBy>("position");
  const [collapseDone, setCollapseDone] = useState(false);
  const [wipLimit, setWipLimit] = useState<number | null>(5);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const issuesList = useMemo(() => {
    const base = Array.isArray(data) ? data : [];
    if (!base.length) return base;
    const hasAny = Object.keys(overrides).length > 0;
    if (!hasAny) return base;
    return base.map((i) => (overrides[i.id] ? { ...i, ...overrides[i.id] } : i));
  }, [data, overrides]);

  const filteredIssues = useMemo(() => {
    const q = filters.q?.trim().toLowerCase();

    return issuesList.filter((issue) => {
      if (q) {
        const hay = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      return true;
    });
  }, [issuesList, filters.q, filters.status, filters.priority]);

  const grouped = useMemo(
    () => ({
      TODO: filteredIssues.filter((i) => i.status === "TODO"),
      IN_PROGRESS: filteredIssues.filter((i) => i.status === "IN_PROGRESS"),
      DONE: filteredIssues.filter((i) => i.status === "DONE"),
    }),
    [filteredIssues]
  );

  const groupedSorted = useMemo(() => {
    const sort = (list: Issue[]) => {
      const arr = [...list];
      if (sortBy === "position") {
        arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      } else if (sortBy === "priority") {
        arr.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
      } else if (sortBy === "dueDate") {
        arr.sort((a, b) => safeTime(a.dueDate) - safeTime(b.dueDate));
      } else {
        arr.sort((a, b) => safeTime(b.updatedAt) - safeTime(a.updatedAt));
      }
      return arr;
    };
    return {
      TODO: sort(grouped.TODO),
      IN_PROGRESS: sort(grouped.IN_PROGRESS),
      DONE: sort(grouped.DONE),
    };
  }, [grouped, sortBy]);

  const activeIssue = useMemo(() => {
    if (!activeId) return null;
    return issuesList.find((i) => i.id === activeId) ?? null;
  }, [activeId, issuesList]);

  // Disable drag while drawer open or mutation in-flight (better UX)
  const dndDisabled = !!selected || moveMut.isPending;

  useHotkeys((e) => {
    if (e.key !== "Escape") return;
    if (isTypingTarget(e.target)) return;
    e.preventDefault();
    if (selected) {
      setSelected(null);
      onSelectedIssueChange?.(null);
    }
  });

  useEffect(() => {
    if (!selectedIssueId) {
      return;
    }

    const match = issuesList.find((issue) => issue.id === selectedIssueId);
    if (match && selected?.id !== match.id) {
      setSelected(match);
    }
  }, [issuesList, selected?.id, selectedIssueId]);

  function onDragStart(e: DragStartEvent) {
    if (dndDisabled) return;
    setActiveId(String(e.active.id));
  }

  function onDragCancel() {
    setActiveId(null);
  }

  function onDragEnd(e: DragEndEvent) {
    if (dndDisabled) {
      setActiveId(null);
      return;
    }

    const issueId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;

    setActiveId(null);
    if (!overId) return;

    const nextStatus = overId as IssueStatus;

    const current = issuesList.find((i) => i.id === issueId);
    if (!current || current.status === nextStatus) return;

    // ✅ optimistic update
    setOverrides((cur) => ({ ...cur, [issueId]: { ...(cur[issueId] ?? {}), status: nextStatus } }));

    moveMut.mutate(
      { issueId, status: nextStatus },
      {
        onError: () => {
          // revert just this card override
          setOverrides((cur) => {
            const next = { ...cur };
            delete next[issueId];
            return next;
          });
        },
        onSettled: () => {
          // clear optimistic override; query invalidation will refresh canonical order/state
          setOverrides((cur) => {
            const next = { ...cur };
            delete next[issueId];
            return next;
          });
        },
      }
    );
  }

  const isTrulyEmpty = issuesList.length === 0;
  const isEmptyAfterFilter = !isTrulyEmpty && filteredIssues.length === 0;

  return (
    <>
      {/* ✅ Always mounted => input never loses focus */}
      <IssueFilterBar members={members} />

      {/* ✅ Initial loading skeleton only (no data yet) */}
      {isLoading && !data ? (
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
      ) : isError ? (
        <div className="space-y-3">
          <div className="text-sm text-destructive">{(error as Error).message}</div>
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* ✅ Refetch hint */}
          {isFetching ? (
            <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
              Updating…
            </div>
          ) : null}

          {/* Empty states */}
          {isTrulyEmpty ? (
            <div className="rounded-xl border border-dashed p-10 text-center bg-muted/10">
              <div className="text-sm font-medium">No issues yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Create your first issue to start tracking work in this project.
              </div>
              <div className="mt-4">
                <Button variant="outline" className="gap-2" onClick={onCreateIssue} disabled={!onCreateIssue}>
                  <Plus className="h-4 w-4" />
                  Create issue
                </Button>
              </div>
            </div>
          ) : isEmptyAfterFilter ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <div className="text-sm font-medium">No issues match your filters</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Try clearing filters or adjusting your search.
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
                    items={groupedSorted[c.key]}
                    onSelect={(it) => {
                      setSelected(it);
                      onSelectedIssueChange?.(it.id);
                    }}
                    projectKey={projectKey}
                    memberNameById={memberNameById}
                    sortBy={sortBy}
                    onChangeSortBy={setSortBy}
                    wipLimit={c.key === "IN_PROGRESS" ? wipLimit : null}
                    onChangeWipLimit={setWipLimit}
                    collapsed={c.key === "DONE" ? collapseDone : false}
                    onToggleCollapsed={c.key === "DONE" ? () => setCollapseDone((v) => !v) : undefined}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeIssue ? (
                  <div className="w-[280px] sm:w-[320px]">
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
        </>
      )}

      {/* Drawer should also stay mounted */}
      <IssueDrawer
        key={selected?.id ?? "none"}
        projectId={projectId}
        issue={selected}
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            onSelectedIssueChange?.(null);
          }
        }}
        members={members}
      />
    </>
  );
}
