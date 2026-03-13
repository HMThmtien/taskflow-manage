import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/i18n";
import { type Issue, type IssueStatus } from "@/features/issues/api/issues.api";
import { useIssuesQuery, useMoveIssueMutation } from "@/features/issues/api/issues.queries";
import { useIssueFilters } from "@/features/issues/api/use-issue-filters";
import { useProjectMembersQuery } from "@/features/project-members/api/project-members.queries";
import { useHotkeys, isTypingTarget } from "@/hooks/use-hotkeys";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";
import { IssueFilterBar } from "@/widgets/issues/issue-filter-bar";
import { IssueDrawer } from "./issue-drawer";
import { KanbanColumn } from "./kanban-column";

const sortColumns = (t: (key: string) => string): { key: IssueStatus; title: string }[] => [
  { key: "TODO", title: t("board.todo") },
  { key: "IN_PROGRESS", title: t("board.inProgress") },
  { key: "DONE", title: t("board.done") },
];

type SortBy = "position" | "priority" | "dueDate" | "updatedAt";

function priorityRank(p: Issue["priority"]) {
  return p === "HIGH" ? 0 : p === "MEDIUM" ? 1 : 2;
}

function safeTime(v?: string | null) {
  if (!v) return Number.POSITIVE_INFINITY;
  const d = new Date(v);
  const time = d.getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
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
  const { t } = useI18n();
  const { filters } = useIssueFilters();
  const { data, isLoading, isFetching, isError, error, refetch } = useIssuesQuery(projectId, filters);
  const moveMut = useMoveIssueMutation(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Partial<Issue>>>({});
  const [sortBy, setSortBy] = useState<SortBy>("position");
  const [collapseDone, setCollapseDone] = useState(false);
  const [wipLimit, setWipLimit] = useState<number | null>(5);

  const membersQ = useProjectMembersQuery(projectId);
  const members = membersQ.data?.map((m) => ({ userId: m.userId, username: m.username })) ?? [];
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) map.set(member.userId, member.username);
    return map;
  }, [members]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const issuesList = useMemo(() => {
    const base = Array.isArray(data) ? data : [];
    if (!base.length || Object.keys(overrides).length === 0) return base;
    return base.map((issue) => (overrides[issue.id] ? { ...issue, ...overrides[issue.id] } : issue));
  }, [data, overrides]);

  const filteredIssues = useMemo(() => {
    const q = filters.q?.trim().toLowerCase();

    return issuesList.filter((issue) => {
      if (q) {
        const haystack = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      return true;
    });
  }, [filters.priority, filters.q, filters.status, issuesList]);

  const grouped = useMemo(
    () => ({
      TODO: filteredIssues.filter((issue) => issue.status === "TODO"),
      IN_PROGRESS: filteredIssues.filter((issue) => issue.status === "IN_PROGRESS"),
      DONE: filteredIssues.filter((issue) => issue.status === "DONE"),
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
    return issuesList.find((issue) => issue.id === activeId) ?? null;
  }, [activeId, issuesList]);

  const dndDisabled = !!selected || moveMut.isPending;
  const columns = useMemo(() => sortColumns(t), [t]);

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
    if (!selectedIssueId) return;
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
    const current = issuesList.find((issue) => issue.id === issueId);
    if (!current || current.status === nextStatus) return;

    setOverrides((currentOverrides) => ({
      ...currentOverrides,
      [issueId]: { ...(currentOverrides[issueId] ?? {}), status: nextStatus },
    }));

    moveMut.mutate(
      { issueId, status: nextStatus },
      {
        onError: () => {
          setOverrides((currentOverrides) => {
            const next = { ...currentOverrides };
            delete next[issueId];
            return next;
          });
        },
        onSettled: () => {
          setOverrides((currentOverrides) => {
            const next = { ...currentOverrides };
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
      <IssueFilterBar members={members} />

      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="h-10 w-full max-w-[720px] animate-pulse rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[520px] rounded-lg border bg-card">
                <div className="p-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-4 space-y-3">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <div key={j} className="h-16 animate-pulse rounded bg-muted" />
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
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <>
          {isFetching ? (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
              {t("board.updating")}
            </div>
          ) : null}

          {isTrulyEmpty ? (
            <div className="rounded-xl border border-dashed bg-muted/10 p-10 text-center">
              <div className="text-sm font-medium">{t("board.noIssuesYet")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t("board.createFirstIssue")}</div>
              <div className="mt-4">
                <Button variant="outline" className="gap-2" onClick={onCreateIssue} disabled={!onCreateIssue}>
                  <Plus className="h-4 w-4" />
                  {t("common.newIssue")}
                </Button>
              </div>
            </div>
          ) : isEmptyAfterFilter ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <div className="text-sm font-medium">{t("board.noIssuesMatch")}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t("board.tryAdjustingFilters")}</div>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
              <div className="grid gap-4 md:grid-cols-3">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.key}
                    id={column.key}
                    title={column.title}
                    items={groupedSorted[column.key]}
                    onSelect={(issue) => {
                      setSelected(issue);
                      onSelectedIssueChange?.(issue.id);
                    }}
                    projectKey={projectKey}
                    memberNameById={memberNameById}
                    sortBy={sortBy}
                    onChangeSortBy={setSortBy}
                    wipLimit={column.key === "IN_PROGRESS" ? wipLimit : null}
                    onChangeWipLimit={setWipLimit}
                    collapsed={column.key === "DONE" ? collapseDone : false}
                    onToggleCollapsed={column.key === "DONE" ? () => setCollapseDone((value) => !value) : undefined}
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
                      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {activeIssue.description?.trim() ? activeIssue.description : t("common.noDescription")}
                      </div>
                    </Card>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      <IssueDrawer
        key={selected?.id ?? "none"}
        projectId={projectId}
        issue={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            onSelectedIssueChange?.(null);
          }
        }}
        members={members}
      />
    </>
  );
}
