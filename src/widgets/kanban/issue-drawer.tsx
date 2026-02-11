import { useEffect, useMemo, useState } from "react";
import { type Issue, type IssueStatus } from "@/features/issues/api/issues.api";
import { useUpdateIssueMutation } from "@/features/issues/api/issues.queries";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { StatusPill } from "@/pages/app/status-pill";
import { PriorityBadge } from "@/pages/app/priority-badge";

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

type Priority = (typeof priorityOptions)[number]["value"];

export function IssueDrawer({
  projectId,
  issue,
  open,
  onOpenChange,
}: {
  projectId: string;
  issue: Issue | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const updateMut = useUpdateIssueMutation(projectId);

  const initial = useMemo(
    () => ({
      title: issue?.title ?? "",
      description: issue?.description ?? "",
      status: (issue?.status ?? "todo") as IssueStatus,
      priority: ((issue as any)?.priority ?? "medium") as Priority, // nếu Issue type đã có priority thì bỏ any
    }),
    [issue]
  );

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<IssueStatus>(initial.status);
  const [priority, setPriority] = useState<Priority>(initial.priority);

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setStatus(initial.status);
    setPriority(initial.priority);
  }, [initial]);

  const dirty =
    title.trim() !== (issue?.title ?? "") ||
    (description ?? "") !== (issue?.description ?? "") ||
    status !== (issue?.status ?? "todo") ||
    priority !== (((issue as any)?.priority ?? "medium") as Priority);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        // khi đóng drawer, reset state về initial để lần mở sau sạch
        if (!v) {
          setTitle(initial.title);
          setDescription(initial.description);
          setStatus(initial.status);
          setPriority(initial.priority);
        }
        onOpenChange(v);
      }}
    >
      <SheetContent className="w-[420px] sm:w-[560px]">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate">{issue ? "Issue" : "Issue"}</SheetTitle>
              {issue ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={status} />
                  <PriorityBadge priority={priority} />
                </div>
              ) : null}
            </div>

            {/* <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
              type="button"
            >
              Close
            </Button> */}
          </div>
        </SheetHeader>

        {!issue ? (
          <div className="mt-6 text-sm text-muted-foreground">No issue selected</div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Priority</div>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Description</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Add details…"
              />
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!dirty || updateMut.isPending}
                onClick={async () => {
                  try {
                    await updateMut.mutateAsync({
                      issueId: issue.id,
                      title: title.trim(),
                      description: description.trim() || undefined,
                      status,
                      // nếu backend/mock của bạn đã hỗ trợ priority update:
                      // priority,
                    } as any);
                    toast({ title: "Saved" });
                    onOpenChange(false);
                  } catch (e: any) {
                    toast({ title: "Save failed", description: e?.message ?? "Unknown error" });
                  }
                }}
              >
                {updateMut.isPending ? "Saving..." : "Save"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!dirty}
                onClick={() => {
                  setTitle(initial.title);
                  setDescription(initial.description);
                  setStatus(initial.status);
                  setPriority(initial.priority);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
