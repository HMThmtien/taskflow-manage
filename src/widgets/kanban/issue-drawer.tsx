import { useMemo, useState } from "react";
import { CalendarClock, GitBranch, MessageSquareText, Paperclip, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/features/i18n/i18n";
import type { Issue, IssuePriority, IssueStatus } from "@/features/issues/api/issues.api";
import {
  useAttachmentsQuery,
  useDeleteAttachmentMutation,
  useUploadAttachmentMutation,
} from "@/features/issues/api/attachments.queries";
import { useSubtasksQuery } from "@/features/issues/api/subtasks.queries";
import { useCreateComment, useIssueComments } from "@/features/issues/api/useIssueComments";
import { useIssueActivities } from "@/features/issues/api/useIssueActivities";
import { useUpdateIssueMutation } from "@/features/issues/api/issues.queries";
import { useToast } from "@/hooks/use-toast";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";
import { AttachmentList } from "@/widgets/issues/attachment-list";
import { AttachmentUpload } from "@/widgets/issues/attachment-upload";
import { CommentEditor } from "@/widgets/issues/comment-editor";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";
import { SubtaskList } from "@/widgets/issues/subtask-list";

type Member = { userId: string; username: string };
type DrawerTab = "details" | "comments" | "activity" | "subtasks" | "attachments";

const statusOptions: IssueStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const priorityOptions: IssuePriority[] = ["LOW", "MEDIUM", "HIGH"];

function isIsoDate(v?: string | null) {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function formatDateTime(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function prettyField(
  t: (key: string, params?: Record<string, string | number | undefined | null>) => string,
  field: string
) {
  const value = String(field).toLowerCase();
  if (value.includes("status")) return t("issue.fieldStatus");
  if (value.includes("priority")) return t("issue.fieldPriority");
  if (value.includes("assignee")) return t("issue.fieldAssignee");
  if (value.includes("due")) return t("issue.fieldDueDate");
  if (value.includes("label")) return t("issue.fieldLabels");
  if (value.includes("title")) return t("issue.fieldTitle");
  if (value.includes("description")) return t("issue.fieldDescription");
  return field;
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
  const { t } = useI18n();
  const normalized = payload ?? {};
  const n = normalized as Partial<Record<string, unknown>>;

  type Change = { field: string; from?: unknown; to?: unknown };
  const maybeChanges = n.changes;
  const changes: Change[] = Array.isArray(maybeChanges)
    ? maybeChanges
        .map((change) => {
          const entry = change as Partial<Record<string, unknown>>;
          const field = typeof entry.field === "string" ? entry.field : t("issue.fieldTitle");
          return { field, from: entry.from ?? entry.old, to: entry.to ?? entry.new };
        })
        .filter(Boolean)
    : typeof n.field === "string"
      ? [{ field: String(n.field), from: n.from ?? n.old, to: n.to ?? n.new }]
      : [];

  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm">
            <span className="font-medium">{actor}</span>{" "}
            <span className="text-muted-foreground">
              {type === "COMMENTED" ? t("issue.commented") : type.replaceAll("_", " ").toLowerCase()}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(createdAt)}</div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[11px]">
          {type}
        </Badge>
      </div>

      {changes.length > 0 ? (
        <div className="mt-3 space-y-2">
          {changes.map((change, index) => (
            <div key={index} className="rounded-md border bg-background/60 px-3 py-2 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">{prettyField(t, change.field)}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {String(change.from ?? t("issue.none"))}
                </Badge>
                <span className="text-muted-foreground">{t("issue.fromToArrow")}</span>
                <Badge variant="secondary" className="font-normal">
                  {String(change.to ?? t("issue.none"))}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : payload && Object.keys(payload).length > 0 ? (
        <pre className="mt-3 overflow-auto rounded-md border bg-muted/60 p-3 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

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
  const { t } = useI18n();
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
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);
  const [dueDate, setDueDate] = useState(initial.dueDate);
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
    if (e instanceof Error) return e.message || t("issue.unknownError");
    if (typeof e === "string") return e;
    return t("issue.unknownError");
  }

  const dirty =
    title.trim() !== (issue?.title ?? "") ||
    description !== (issue?.description ?? "") ||
    status !== (issue?.status ?? "TODO") ||
    priority !== (issue?.priority ?? "MEDIUM") ||
    (assigneeId || "") !== (issue?.assigneeId ?? "") ||
    (dueDate || "") !== (issue?.dueDate ?? "") ||
    JSON.stringify(labels) !== JSON.stringify(issue?.labels ?? []);

  const addLabel = () => {
    const value = labelInput.trim();
    if (!value) return;
    setLabels(Array.from(new Set([...(labels ?? []), value])));
    setLabelInput("");
  };

  const removeLabel = (value: string) => setLabels((prev) => prev.filter((label) => label !== value));

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) {
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
        onOpenChange(value);
      }}
    >
      <SheetContent className="w-[420px] p-0 sm:w-[620px]">
        <div className="flex h-full flex-col">
          <div className="p-6 pb-4">
            <SheetHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="truncate">{t("issue.title")}</SheetTitle>
                  {issue ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <IssueTypeBadge type={issue.type} />
                      <StatusPill status={status} />
                      <PriorityBadge priority={priority} />
                      {issue.reporterUsername ? (
                        <span className="text-xs text-muted-foreground">
                          {t("issue.reporter", { name: issue.reporterUsername })}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </SheetHeader>
          </div>

          {!issue ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">{t("issue.noIssueSelected")}</div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24">
              <Tabs value={tab} onValueChange={(value) => setTab(value as DrawerTab)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="details">{t("issue.details")}</TabsTrigger>
                  <TabsTrigger value="comments">{t("issue.comments")}</TabsTrigger>
                  <TabsTrigger value="activity">{t("issue.activity")}</TabsTrigger>
                  <TabsTrigger value="subtasks">{t("issue.subtasks")}</TabsTrigger>
                  <TabsTrigger value="attachments">{t("issue.files")}</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="space-y-5 pt-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">{t("issue.titleField")}</div>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">{t("issue.status")}</div>
                        <Select value={status} onValueChange={(value) => setStatus(value as IssueStatus)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("issue.selectStatus")} />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`status.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">{t("issue.priority")}</div>
                        <Select value={priority} onValueChange={(value) => setPriority(value as IssuePriority)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("issue.selectPriority")} />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`priority.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">{t("issue.assignee")}</div>
                        <Select value={assigneeId || "none"} onValueChange={(value) => setAssigneeId(value === "none" ? "" : value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("issue.selectAssignee")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("board.unassigned")}</SelectItem>
                            {(members ?? []).map((member) => (
                              <SelectItem key={member.userId} value={member.userId}>
                                {member.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">{t("issue.dueDate")}</div>
                        <DatePickerField value={dueDate || ""} onChange={setDueDate} placeholder={t("issue.pickDueDate")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">{t("issue.labels")}</div>
                      <div className="flex gap-2">
                        <Input
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          placeholder={t("issue.addLabel")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addLabel();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addLabel} disabled={!labelInput.trim()}>
                          {t("issue.add")}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {labels.map((label) => (
                          <Badge key={label} className="cursor-pointer" title={t("board.clickToRemove")} onClick={() => removeLabel(label)}>
                            {label}
                          </Badge>
                        ))}
                        {labels.length === 0 ? (
                          <div className="text-xs text-muted-foreground">{t("issue.noLabels")}</div>
                        ) : null}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">{t("issue.description")}</div>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={8}
                        placeholder={t("issue.addDetails")}
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
                          toast({ title: t("issue.commentAdded") });
                        } catch (e: unknown) {
                          toast({ title: t("issue.failed"), description: errMsg(e), variant: "destructive" });
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
                      <div className="text-sm text-destructive">{t("issue.failedLoadComments")}</div>
                    ) : (commentsQ.data ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t("issue.noCommentsYet")}</div>
                    ) : (
                      <div className="space-y-3">
                        {commentsQ.data!.map((comment: any) => (
                          <div key={comment.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{comment.authorUsername}</div>
                              <div className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</div>
                            {comment.mentions?.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {comment.mentions.map((mention: any) => (
                                  <Badge key={mention.id} variant="outline" className="text-[11px]">
                                    @{mention.username}
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
                      <div className="text-sm text-destructive">{t("issue.failedLoadActivity")}</div>
                    ) : (activitiesQ.data ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t("issue.noActivityYet")}</div>
                    ) : (
                      <div className="space-y-3">
                        {activitiesQ.data!.map((activity: any) => (
                          <ActivityCard
                            key={activity.id}
                            actor={activity.actorUsername}
                            type={activity.type}
                            createdAt={activity.createdAt}
                            payload={activity.payload}
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
                      {t("issue.subtasks")}
                    </div>

                    {subtasksQ.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : subtasksQ.isError ? (
                      <div className="text-sm text-destructive">{t("issue.failedLoadSubtasks")}</div>
                    ) : (
                      <SubtaskList items={subtasksQ.data ?? []} />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments">
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Paperclip className="h-4 w-4" />
                      {t("issue.files")}
                    </div>

                    <AttachmentUpload
                      disabled={uploadAttachmentMut.isPending}
                      onSelect={async (file) => {
                        try {
                          await uploadAttachmentMut.mutateAsync(file);
                          toast({ title: t("issue.attachmentUploaded") });
                        } catch (e: unknown) {
                          toast({ title: t("issue.uploadFailed"), description: errMsg(e), variant: "destructive" });
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
                      <div className="text-sm text-destructive">{t("issue.failedLoadAttachments")}</div>
                    ) : (
                      <AttachmentList
                        items={attachmentsQ.data ?? []}
                        baseUrl={import.meta.env.VITE_API_BASE_URL}
                        deletingId={(deleteAttachmentMut.variables as string) ?? null}
                        onDelete={async (attachmentId) => {
                          try {
                            await deleteAttachmentMut.mutateAsync(attachmentId);
                            toast({ title: t("issue.attachmentDeleted") });
                          } catch (e: unknown) {
                            toast({ title: t("issue.deleteFailed"), description: errMsg(e), variant: "destructive" });
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
            <div className="absolute bottom-0 left-0 right-0 border-t bg-background/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {tab === "details" ? (
                    <>
                      <Save className="h-4 w-4" />
                      {dirty ? t("issue.unsavedChanges") : t("issue.allChangesSaved")}
                    </>
                  ) : tab === "comments" ? (
                    <>
                      <MessageSquareText className="h-4 w-4" />
                      {t("issue.comments")}
                    </>
                  ) : tab === "activity" ? (
                    <>
                      <CalendarClock className="h-4 w-4" />
                      {t("issue.activity")}
                    </>
                  ) : tab === "subtasks" ? (
                    <>
                      <GitBranch className="h-4 w-4" />
                      {t("issue.subtasks")}
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4" />
                      {t("issue.files")}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    disabled={tab !== "details" || !dirty || updateMut.isPending}
                    onClick={async () => {
                      if (!issue) return;
                      try {
                        await updateMut.mutateAsync({
                          issueId: issue.id,
                          payload: {
                            title: title.trim() || undefined,
                            description: description.trim() || undefined,
                            status,
                            priority,
                            assigneeId: assigneeId || undefined,
                            dueDate: isIsoDate(dueDate) ? dueDate : dueDate || undefined,
                            labels,
                          },
                        });
                        toast({ title: t("issue.saved") });
                        onOpenChange(false);
                      } catch (e: unknown) {
                        toast({ title: t("issue.saveFailed"), description: errMsg(e), variant: "destructive" });
                      }
                    }}
                  >
                    {updateMut.isPending ? t("common.saving") : t("common.save")}
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
