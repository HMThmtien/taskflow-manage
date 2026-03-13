import { useEffect, useMemo, useState } from "react";
import { type Issue, type IssuePriority, type IssueStatus } from "@/features/issues/api/issues.api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, MessageSquareText, Save, Paperclip, GitBranch } from "lucide-react";

import { useIssueComments, useCreateComment } from "@/features/issues/api/useIssueComments";
import { useIssueActivities } from "@/features/issues/api/useIssueActivities";
import { useSubtasksQuery } from "@/features/issues/api/subtasks.queries";
import {
  useAttachmentsQuery,
  useDeleteAttachmentMutation,
  useUploadAttachmentMutation,
} from "@/features/issues/api/attachments.queries";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { AttachmentList } from "@/widgets/issues/attachment-list";
import { AttachmentUpload } from "@/widgets/issues/attachment-upload";
import { SubtaskList } from "@/widgets/issues/subtask-list";
import { CommentEditor } from "@/widgets/issues/comment-editor";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";

type Member = { userId: string; username: string };

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const priorityOptions: { value: IssuePriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

function isIsoDate(v?: string | null) {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function formatDateTime(v: string) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function prettyField(field: string) {
  const f = String(field);
  if (f.toLowerCase().includes("status")) return "Status";
  if (f.toLowerCase().includes("priority")) return "Priority";
  if (f.toLowerCase().includes("assignee")) return "Assignee";
  if (f.toLowerCase().includes("due")) return "Due date";
  if (f.toLowerCase().includes("label")) return "Labels";
  if (f.toLowerCase().includes("title")) return "Title";
  if (f.toLowerCase().includes("description")) return "Description";
  return f;
}

function ActivityCard({
  actor,
  type,
  createdAt,
  payload,
}: {
  actor: string;
  type: string;
  createdAt: string;
  payload?: Record<string, unknown>;
}) {
  const normalized = payload ?? {};
  const n = normalized as Partial<Record<string, unknown>>;

  type Change = { field: string; from?: unknown; to?: unknown };
  const maybeChanges = n.changes;
  const changes: Change[] = Array.isArray(maybeChanges)
    ? (maybeChanges as unknown[])
        .map((c) => {
          const cc = c as Partial<Record<string, unknown>>;
          const field = typeof cc.field === "string" ? cc.field : "Field";
          return { field, from: cc.from ?? cc.old, to: cc.to ?? cc.new };
        })
        .filter(Boolean)
    : typeof n.field === "string"
      ? [{ field: String(n.field), from: n.from ?? n.old, to: n.to ?? n.new }]
      : [];

  const hasStructured = changes.length > 0;

  return (
    <div className="rounded-lg border p-3 bg-card/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm">
            <span className="font-medium">{actor}</span>{" "}
            <span className="text-muted-foreground">
              {type === "COMMENTED" ? "commented" : type.replaceAll("_", " ").toLowerCase()}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(createdAt)}</div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[11px]">
          {type}
        </Badge>
      </div>

      {hasStructured ? (
        <div className="mt-3 space-y-2">
          {changes.map((c, i) => (
            <div key={i} className="text-sm rounded-md border bg-background/60 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">{prettyField(c.field)}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {String(c.from ?? "—")}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary" className="font-normal">
                  {String(c.to ?? "—")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : payload && Object.keys(payload).length > 0 ? (
        <pre className="mt-3 text-xs bg-muted/60 p-3 rounded-md overflow-auto border">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

type DrawerTab = "details" | "comments" | "activity" | "subtasks" | "attachments";

export function IssueDrawer({
  projectId,
  issue,
  open,
  onOpenChange,
  members,
}: {
  projectId: string;
  issue: Issue | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members?: Member[];
}) {
  const { toast } = useToast();
  const updateMut = useUpdateIssueMutation(projectId);

  const initial = useMemo(
    () => ({
      title: issue?.title ?? "",
      description: issue?.description ?? "",
      status: (issue?.status ?? "TODO") as IssueStatus,
      priority: (issue?.priority ?? "MEDIUM") as IssuePriority,
      assigneeId: issue?.assigneeId ?? "",
      dueDate: issue?.dueDate ?? "",
      labels: issue?.labels ?? [],
    }),
    [issue]
  );

  const [tab, setTab] = useState<DrawerTab>("details");

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState<IssueStatus>(initial.status);
  const [priority, setPriority] = useState<IssuePriority>(initial.priority);
  const [assigneeId, setAssigneeId] = useState<string>(initial.assigneeId);
  const [dueDate, setDueDate] = useState<string>(initial.dueDate);
  const [labels, setLabels] = useState<string[]>(initial.labels);
  const [labelInput, setLabelInput] = useState("");

  const issueId = issue?.id ?? "";
  const commentsQ = useIssueComments(issueId || null, open && tab === "comments");
  const activitiesQ = useIssueActivities(issueId || null, open && tab === "activity");
  const createCommentMut = useCreateComment(issueId);

  const subtasksQ = useSubtasksQuery(projectId, issueId);
  const attachmentsQ = useAttachmentsQuery(issueId);
  const uploadAttachmentMut = useUploadAttachmentMutation(issueId);
  const deleteAttachmentMut = useDeleteAttachmentMutation(issueId);

  function errMsg(e: unknown) {
    if (e instanceof Error) return e.message || "Unknown error";
    if (typeof e === "string") return e;
    return "Unknown error";
  }

  const dirty =
    title.trim() !== (issue?.title ?? "") ||
    (description ?? "") !== (issue?.description ?? "") ||
    status !== (issue?.status ?? "TODO") ||
    priority !== (issue?.priority ?? "MEDIUM") ||
    (assigneeId || "") !== (issue?.assigneeId ?? "") ||
    (dueDate || "") !== (issue?.dueDate ?? "") ||
    JSON.stringify(labels) !== JSON.stringify(issue?.labels ?? []);

  const addLabel = () => {
    const v = labelInput.trim();
    if (!v) return;
    const next = Array.from(new Set([...(labels ?? []), v]));
    setLabels(next);
    setLabelInput("");
  };

  const removeLabel = (v: string) => {
    setLabels((prev) => prev.filter((x) => x !== v));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setTitle(initial.title);
          setDescription(initial.description);
          setStatus(initial.status);
          setPriority(initial.priority);
          setAssigneeId(initial.assigneeId);
          setDueDate(initial.dueDate);
          setLabels(initial.labels);
          setLabelInput("");
          setTab("details");
        }
        onOpenChange(v);
      }}
    >
      <SheetContent className="w-[420px] sm:w-[620px] p-0">
        <div className="flex h-full flex-col">
          <div className="p-6 pb-4">
            <SheetHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="truncate">Issue</SheetTitle>
                  {issue ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <IssueTypeBadge type={issue.type} />
                      <StatusPill status={status} />
                      <PriorityBadge priority={priority} />
                      {issue.reporterUsername ? (
                        <span className="text-xs text-muted-foreground">
                          Reporter: {issue.reporterUsername}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </SheetHeader>
          </div>

          {!issue ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">No issue selected</div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24">
              <Tabs value={tab} onValueChange={(v) => setTab(v as DrawerTab)}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                  <TabsTrigger value="attachments">Files</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="space-y-5 pt-4">
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
                        <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Assignee</div>
                        <Select
                          value={assigneeId || "none"}
                          onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {(members ?? []).map((m) => (
                              <SelectItem key={m.userId} value={m.userId}>
                                {m.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Due date</div>
                        <DatePickerField
                          value={dueDate || ""}
                          onChange={setDueDate}
                          placeholder="Pick due date"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Labels</div>

                      <div className="flex gap-2">
                        <Input
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          placeholder="Add label (press Enter)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addLabel();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addLabel} disabled={!labelInput.trim()}>
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {labels.map((lb) => (
                          <Badge
                            key={lb}
                            className="cursor-pointer"
                            title="Click to remove"
                            onClick={() => removeLabel(lb)}
                          >
                            {lb}
                          </Badge>
                        ))}
                        {labels.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No labels</div>
                        ) : null}
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
                  </div>
                </TabsContent>

                <TabsContent value="comments">
                  <div className="space-y-4 pt-4">
                    <CommentEditor
                      isSubmitting={createCommentMut.isPending}
                      onSubmit={async (content) => {
                        try {
                          await createCommentMut.mutateAsync(content);
                          toast({ title: "Comment added" });
                        } catch (e: unknown) {
                          toast({
                            title: "Failed",
                            description: errMsg(e),
                            variant: "destructive",
                          });
                        }
                      }}
                    />

                    <Separator />

                    {commentsQ.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="mt-3 h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-5/6" />
                          </div>
                        ))}
                      </div>
                    ) : commentsQ.isError ? (
                      <div className="text-sm text-destructive">Failed to load comments</div>
                    ) : (commentsQ.data ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No comments yet</div>
                    ) : (
                      <div className="space-y-3">
                        {commentsQ.data!.map((c: any) => (
                          <div key={c.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{c.authorUsername}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="mt-2 text-sm whitespace-pre-wrap">{c.content}</div>

                            {c.mentions?.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.mentions.map((m: any) => (
                                  <Badge key={m.id} variant="outline" className="text-[11px]">
                                    @{m.username}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <div className="space-y-4 pt-4">
                    {activitiesQ.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="mt-3 h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : activitiesQ.isError ? (
                      <div className="text-sm text-destructive">Failed to load activity</div>
                    ) : (activitiesQ.data ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">No activity yet</div>
                    ) : (
                      <div className="space-y-3">
                        {activitiesQ.data!.map((a: any) => (
                          <ActivityCard
                            key={a.id}
                            actor={a.actorUsername}
                            type={a.type}
                            createdAt={a.createdAt}
                            payload={a.payload}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="subtasks">
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GitBranch className="h-4 w-4" />
                      Subtasks
                    </div>

                    {subtasksQ.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : subtasksQ.isError ? (
                      <div className="text-sm text-destructive">Failed to load subtasks</div>
                    ) : (
                      <SubtaskList items={subtasksQ.data ?? []} />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments">
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </div>

                    <AttachmentUpload
                      disabled={uploadAttachmentMut.isPending}
                      onSelect={async (file) => {
                        try {
                          await uploadAttachmentMut.mutateAsync(file);
                          toast({ title: "Attachment uploaded" });
                        } catch (e: unknown) {
                          toast({
                            title: "Upload failed",
                            description: errMsg(e),
                            variant: "destructive",
                          });
                        }
                      }}
                    />

                    {attachmentsQ.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : attachmentsQ.isError ? (
                      <div className="text-sm text-destructive">Failed to load attachments</div>
                    ) : (
                      <AttachmentList
                        items={attachmentsQ.data ?? []}
                        baseUrl={import.meta.env.VITE_API_BASE_URL}
                        deletingId={(deleteAttachmentMut.variables as string) ?? null}
                        onDelete={async (attachmentId) => {
                          try {
                            await deleteAttachmentMut.mutateAsync(attachmentId);
                            toast({ title: "Attachment deleted" });
                          } catch (e: unknown) {
                            toast({
                              title: "Delete failed",
                              description: errMsg(e),
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {issue ? (
            <div className="absolute bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {tab === "details" ? (
                    <>
                      <Save className="h-4 w-4" />
                      {dirty ? "Unsaved changes" : "All changes saved"}
                    </>
                  ) : tab === "comments" ? (
                    <>
                      <MessageSquareText className="h-4 w-4" />
                      Comments
                    </>
                  ) : tab === "activity" ? (
                    <>
                      <CalendarClock className="h-4 w-4" />
                      Activity
                    </>
                  ) : tab === "subtasks" ? (
                    <>
                      <GitBranch className="h-4 w-4" />
                      Subtasks
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    disabled={tab !== "details" || !dirty || updateMut.isPending}
                    onClick={async () => {
                      if (!issue) return;
                      try {
                        const payload = {
                          title: title.trim() || undefined,
                          description: description.trim() || undefined,
                          status,
                          priority,
                          assigneeId: assigneeId || undefined,
                          dueDate: isIsoDate(dueDate) ? dueDate : dueDate || undefined,
                          labels,
                        };

                        await updateMut.mutateAsync({ issueId: issue.id, payload });
                        toast({ title: "Saved" });
                        onOpenChange(false);
                      } catch (e: unknown) {
                        toast({
                          title: "Save failed",
                          description: errMsg(e),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {updateMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}