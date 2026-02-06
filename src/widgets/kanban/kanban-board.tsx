import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { type Issue, type IssueStatus } from "@/features/issues/api/issues.api";
import { useIssuesQuery, useMoveIssueMutation } from "@/features/issues/api/issues.queries";
import { KanbanColumn } from "./kanban-column";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IssueDrawer } from "./issue-drawer";


const columns: { key: IssueStatus; title: string }[] = [
  { key: "todo", title: "Todo" },
  { key: "in_progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, error, refetch } = useIssuesQuery(projectId);
  const moveMut = useMoveIssueMutation(projectId);

  const [selected, setSelected] = useState<Issue | null>(null);

  const [q, setQ] = useState("");

const filtered = useMemo(() => {
  const list = data ?? [];
  const s = q.trim().toLowerCase();
  if (!s) return list;
  return list.filter((i) => i.title.toLowerCase().includes(s));
}, [data, q]);

const grouped = useMemo(() => {
  const list = filtered ?? [];
  return {
    todo: list.filter((i) => i.status === "todo"),
    in_progress: list.filter((i) => i.status === "in_progress"),
    done: list.filter((i) => i.status === "done"),
  };
}, [filtered]);


  function onDragEnd(e: DragEndEvent) {
    const issueId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // overId sẽ là status (todo/in_progress/done)
    const nextStatus = overId as IssueStatus;
    const current = (data ?? []).find((i) => i.id === issueId);
    if (!current || current.status === nextStatus) return;

    moveMut.mutate({ issueId, status: nextStatus });
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading board…</div>;

  if (isError) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-destructive">{(error as Error).message}</div>
        <button className="underline text-sm" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center justify-between gap-3">
  <input
    className="h-10 w-full max-w-sm rounded-md border bg-background px-3 text-sm"
    placeholder="Search issues..."
    value={q}
    onChange={(e) => setQ(e.target.value)}
  />
</div>

      <DndContext onDragEnd={onDragEnd}>
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
      </DndContext>

      {/* <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div className="text-muted-foreground">Status: {selected?.status}</div>
            <div>{selected?.description ?? "No description"}</div>
          </div>
        </SheetContent>
      </Sheet> */}

      <IssueDrawer
            projectId={projectId}
            issue={selected}
            open={!!selected}
            onOpenChange={(o) => !o && setSelected(null)}
            />

    </>

    
  );
}
