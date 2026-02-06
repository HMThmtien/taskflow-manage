import { useEffect, useMemo, useState } from "react";
import { type Issue, type IssueStatus } from "@/features/issues/api/issues.api";
import { useUpdateIssueMutation } from "@/features/issues/api/issues.queries";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

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
      status: issue?.status ?? "todo",
    }),
    [issue]
  );

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<IssueStatus>(initial.status);

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setStatus(initial.status);
  }, [initial]);

  const dirty =
    title.trim() !== (issue?.title ?? "") ||
    (description ?? "") !== (issue?.description ?? "") ||
    status !== (issue?.status ?? "todo");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[520px]">
        <SheetHeader>
          <SheetTitle>Issue</SheetTitle>
        </SheetHeader>

        {!issue ? (
          <div className="mt-6 text-sm text-muted-foreground">No issue selected</div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Status</div>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Description</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
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
                    });
                    toast({ title: "Saved" });
                    onOpenChange(false);
                  } catch (e: any) {
                    toast({ title: "Save failed", description: e.message });
                  }
                }}
              >
                {updateMut.isPending ? "Saving..." : "Save"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle(initial.title);
                  setDescription(initial.description);
                  setStatus(initial.status);
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
