import { useEffect, useMemo, useState, type DragEvent } from "react";
import {
  CalendarRange,
  Flag,
  Layers3,
  PlayCircle,
  Plus,
  Rocket,
  SquareKanban,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { BulkUpdateIssuesPayload, Issue, IssuePriority, IssueStatus } from "@/features/issues/api/issues.api";
import { useBulkUpdateIssuesMutation, useIssuesQuery } from "@/features/issues/api/issues.queries";
import { useI18n } from "@/features/i18n/i18n";
import { useMyProjectRoleQuery, useProjectMembersQuery } from "@/features/project-members/api/project-members.queries";
import type {
  CompleteSprintPayload,
  Sprint,
  SprintCompletionAction,
  SprintMetrics,
  SprintPayload,
} from "@/features/sprints/api/sprints.api";
import {
  useAssignIssueToSprintMutation,
  useBacklogIssuesQuery,
  useCompleteSprintMutation,
  useCreateSprintMutation,
  useSprintMetricsQuery,
  useSprintsQuery,
  useStartSprintMutation,
  useUpdateSprintMutation,
} from "@/features/sprints/api/sprints.queries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";
import { IssueDrawer } from "@/widgets/kanban/issue-drawer";

type SprintFormState = {
  name: string;
  goal: string;
  description: string;
  startDate: string;
  endDate: string;
};

type CompleteSprintFormState = {
  completionAction: SprintCompletionAction;
  targetSprintId: string;
};

type BulkEditState = {
  status: IssueStatus | "";
  priority: IssuePriority | "";
  assigneeId: string;
  sprintId: string;
};

function emptyForm(): SprintFormState {
  return { name: "", goal: "", description: "", startDate: "", endDate: "" };
}

function emptyCompleteForm(): CompleteSprintFormState {
  return { completionAction: "MOVE_TO_BACKLOG", targetSprintId: "" };
}

function emptyBulkEdit(): BulkEditState {
  return { status: "", priority: "", assigneeId: "", sprintId: "" };
}

function normalizePayload(state: SprintFormState): SprintPayload {
  return {
    name: state.name.trim(),
    goal: state.goal.trim() || undefined,
    description: state.description.trim() || undefined,
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined,
  };
}

function sprintTone(status: Sprint["status"]) {
  if (status === "ACTIVE") return "default";
  if (status === "COMPLETED") return "secondary";
  return "outline";
}

function formatDateRange(
  t: (key: string, params?: Record<string, string | number | undefined | null>) => string,
  start?: string | null,
  end?: string | null
) {
  if (!start && !end) return t("backlog.noScheduleYet");
  if (start && end) return `${start} -> ${end}`;
  return start ? t("backlog.startsAt", { date: start }) : t("backlog.endsAt", { date: end });
}

function getSprintMetricsSummary(sprint: Sprint, liveMetrics?: SprintMetrics | null) {
  const total = liveMetrics?.totalIssues ?? sprint.completedTotalIssues ?? sprint.issueCount ?? 0;
  const done = liveMetrics?.doneIssues ?? sprint.completedDoneIssues ?? 0;
  const inProgress = liveMetrics?.inProgressIssues ?? sprint.completedInProgressIssues ?? 0;
  const todo = liveMetrics?.todoIssues ?? sprint.completedTodoIssues ?? Math.max(0, total - done - inProgress);
  const unfinished = liveMetrics?.unfinishedIssues ?? Math.max(0, total - done);
  const completionPercent =
    liveMetrics?.completionPercent ??
    (total > 0 ? Math.round((done * 100) / total) : 0);

  return { total, done, inProgress, todo, unfinished, completionPercent };
}

function IssuePlanningList({
  title,
  issues,
  sprintOptions,
  canPlanIssues,
  assignPending,
  selectedIssueId,
  selectedIssueIds,
  draggableIssues = false,
  onSelectIssue,
  onToggleIssue,
  onToggleAll,
  onAssign,
  onDragIssueStart,
  onDragIssueEnd,
}: {
  title: string;
  issues: Issue[];
  sprintOptions: Sprint[];
  canPlanIssues: boolean;
  assignPending: boolean;
  selectedIssueId?: string | null;
  selectedIssueIds: string[];
  draggableIssues?: boolean;
  onSelectIssue: (issue: Issue | null) => void;
  onToggleIssue: (issueId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onAssign: (issueId: string, sprintId?: string | null) => void;
  onDragIssueStart?: (issueId: string) => void;
  onDragIssueEnd?: () => void;
}) {
  const { t } = useI18n();
  const allSelected = issues.length > 0 && issues.every((issue) => selectedIssueIds.includes(issue.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={allSelected} onCheckedChange={(checked) => onToggleAll(!!checked)} />
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary">{issues.length}</Badge>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          {t("backlog.noIssuesInSection")}
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              draggable={draggableIssues && canPlanIssues}
              onDragStart={() => onDragIssueStart?.(issue.id)}
              onDragEnd={() => onDragIssueEnd?.()}
              className={cn(
                "rounded-xl border bg-card/70 p-3 transition-colors",
                draggableIssues && canPlanIssues && "cursor-grab active:cursor-grabbing",
                selectedIssueId === issue.id ? "border-primary/40 ring-1 ring-primary/20" : "hover:bg-accent/30"
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Checkbox
                    checked={selectedIssueIds.includes(issue.id)}
                    onCheckedChange={(checked) => onToggleIssue(issue.id, !!checked)}
                    className="mt-1"
                  />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelectIssue(issue)}>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <IssueTypeBadge type={issue.type} />
                      <span className="truncate font-medium text-foreground">{issue.title}</span>
                      {issue.sprintName ? (
                        <Badge variant="outline" className="shrink-0">
                          {issue.sprintName}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusPill status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                      {issue.assigneeUsername ? <span>@{issue.assigneeUsername}</span> : <span>{t("board.unassigned")}</span>}
                      {issue.dueDate ? <span>{t("board.dueShort", { date: issue.dueDate })}</span> : null}
                    </div>
                  </button>
                </div>

                <div className="w-full lg:w-[240px]">
                  <Select
                    value={issue.sprintId ?? "backlog"}
                    disabled={!canPlanIssues || assignPending || issue.sprintStatus === "COMPLETED"}
                    onValueChange={(value) => onAssign(issue.id, value === "backlog" ? null : value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("backlog.moveToSprint")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">{t("backlog.backlog")}</SelectItem>
                      {sprintOptions.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SprintDialog({
  open,
  title,
  state,
  saving,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  state: SprintFormState;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: SprintFormState) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("backlog.sprintName")}</div>
            <Input
              value={state.name}
              onChange={(e) => onChange({ ...state, name: e.target.value })}
              placeholder={t("backlog.sprintNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("backlog.goal")}</div>
            <Input
              value={state.goal}
              onChange={(e) => onChange({ ...state, goal: e.target.value })}
              placeholder={t("backlog.goalPlaceholder")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t("backlog.startDate")}</div>
              <DatePickerField
                value={state.startDate}
                onChange={(value) => onChange({ ...state, startDate: value })}
                placeholder={t("backlog.pickStartDate")}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("backlog.endDate")}</div>
              <DatePickerField
                value={state.endDate}
                onChange={(value) => onChange({ ...state, endDate: value })}
                placeholder={t("backlog.pickEndDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("backlog.descriptionField")}</div>
            <Textarea
              value={state.description}
              onChange={(e) => onChange({ ...state, description: e.target.value })}
              className="min-h-[140px]"
              placeholder={t("backlog.descriptionPlaceholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={saving || state.name.trim().length < 2}>
            {saving ? t("common.saving") : t("backlog.saveSprint")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteSprintDialog({
  open,
  sprint,
  metrics,
  plannedSprints,
  state,
  saving,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  sprint: Sprint | null;
  metrics?: SprintMetrics | null;
  plannedSprints: Sprint[];
  state: CompleteSprintFormState;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (next: CompleteSprintFormState) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  const unfinishedCount = metrics?.unfinishedIssues ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t("backlog.completeSprint")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="font-medium text-foreground">{sprint?.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {unfinishedCount > 0
                ? t("backlog.completeSprintDescription", { count: unfinishedCount })
                : t("backlog.completeSprintNoUnfinished")}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.totalIssues")}</div>
              <div className="mt-1 text-2xl font-semibold">{metrics?.totalIssues ?? 0}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.doneIssues")}</div>
              <div className="mt-1 text-2xl font-semibold">{metrics?.doneIssues ?? 0}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.unfinishedIssues")}</div>
              <div className="mt-1 text-2xl font-semibold">{unfinishedCount}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t("backlog.unfinishedAction")}</div>
            <RadioGroup
              value={state.completionAction}
              onValueChange={(value) =>
                onChange({
                  completionAction: value as SprintCompletionAction,
                  targetSprintId: value === "MOVE_TO_SPRINT" ? state.targetSprintId : "",
                })
              }
              className="space-y-3"
            >
              <label className="flex items-start gap-3 rounded-xl border p-3">
                <RadioGroupItem value="MOVE_TO_BACKLOG" id="move-to-backlog" className="mt-1" />
                <div className="space-y-1">
                  <div className="font-medium">{t("backlog.moveUnfinishedToBacklog")}</div>
                  <div className="text-sm text-muted-foreground">{t("backlog.moveUnfinishedToBacklogHint")}</div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border p-3">
                <RadioGroupItem value="MOVE_TO_SPRINT" id="move-to-sprint" className="mt-1" />
                <div className="space-y-1">
                  <div className="font-medium">{t("backlog.moveUnfinishedToSprint")}</div>
                  <div className="text-sm text-muted-foreground">{t("backlog.moveUnfinishedToSprintHint")}</div>
                </div>
              </label>
            </RadioGroup>
          </div>

          {state.completionAction === "MOVE_TO_SPRINT" ? (
            <div className="space-y-2">
              <Label>{t("backlog.targetSprint")}</Label>
              <Select
                value={state.targetSprintId}
                onValueChange={(value) => onChange({ ...state, targetSprintId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("backlog.selectTargetSprint")} />
                </SelectTrigger>
                <SelectContent>
                  {plannedSprints.map((plannedSprint) => (
                    <SelectItem key={plannedSprint.id} value={plannedSprint.id}>
                      {plannedSprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              saving ||
              (state.completionAction === "MOVE_TO_SPRINT" &&
                (!state.targetSprintId || plannedSprints.length === 0))
            }
          >
            {saving ? t("common.saving") : t("backlog.completeSprint")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SprintMetricsCard({
  sprint,
  metrics,
  dragActive,
  onDropIssue,
  onDragOver,
  onDragLeave,
}: {
  sprint: Sprint;
  metrics?: SprintMetrics | null;
  dragActive: boolean;
  onDropIssue: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
}) {
  const { t } = useI18n();
  const summary = getSprintMetricsSummary(sprint, metrics);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-primary/[0.04] p-4 transition-colors",
        dragActive && "border-primary border-dashed bg-primary/10"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDropIssue}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{t("backlog.progressOverview")}</div>
          <div className="text-xs text-muted-foreground">{t("backlog.progressOverviewHint")}</div>
        </div>
        <Badge variant="outline">{summary.completionPercent}%</Badge>
      </div>

      <Progress value={summary.completionPercent} className="mt-4" />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-background/70 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.totalIssues")}</div>
          <div className="mt-1 text-xl font-semibold">{summary.total}</div>
        </div>
        <div className="rounded-xl border bg-background/70 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.doneIssues")}</div>
          <div className="mt-1 text-xl font-semibold">{summary.done}</div>
        </div>
        <div className="rounded-xl border bg-background/70 p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.inProgressIssues")}</div>
          <div className="mt-1 text-xl font-semibold">{summary.inProgress}</div>
        </div>
      </div>

      {dragActive ? (
        <div className="mt-4 rounded-xl border border-dashed px-3 py-2 text-sm text-primary">
          {t("backlog.dropIssueHere")}
        </div>
      ) : null}
    </div>
  );
}

function BulkIssueActionBar({
  selectedCount,
  members,
  sprintOptions,
  canPlanIssues,
  pending,
  state,
  onChange,
  onApply,
  onClearSelection,
}: {
  selectedCount: number;
  members: Array<{ userId: string; username: string }>;
  sprintOptions: Sprint[];
  canPlanIssues: boolean;
  pending: boolean;
  state: BulkEditState;
  onChange: (next: BulkEditState) => void;
  onApply: () => void;
  onClearSelection: () => void;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-primary/30 bg-primary/[0.04] shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">{t("backlog.bulkEditTitle", { count: selectedCount })}</div>
            <div className="text-sm text-muted-foreground">{t("backlog.bulkEditHint")}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            {t("backlog.clearSelection")}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>{t("backlog.bulkStatus")}</Label>
            <Select
              value={state.status || "__unchanged__"}
              onValueChange={(value) =>
                onChange({ ...state, status: value === "__unchanged__" ? "" : (value as IssueStatus) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("backlog.leaveUnchanged")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unchanged__">{t("backlog.leaveUnchanged")}</SelectItem>
                <SelectItem value="TODO">{t("board.todo")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("board.inProgress")}</SelectItem>
                <SelectItem value="DONE">{t("board.done")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("backlog.bulkPriority")}</Label>
            <Select
              value={state.priority || "__unchanged__"}
              onValueChange={(value) =>
                onChange({ ...state, priority: value === "__unchanged__" ? "" : (value as IssuePriority) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("backlog.leaveUnchanged")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unchanged__">{t("backlog.leaveUnchanged")}</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("board.assignee")}</Label>
            <Select
              value={state.assigneeId || "__unchanged__"}
              onValueChange={(value) => onChange({ ...state, assigneeId: value === "__unchanged__" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("backlog.leaveUnchanged")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unchanged__">{t("backlog.leaveUnchanged")}</SelectItem>
                <SelectItem value="__clear__">{t("backlog.clearAssignee")}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    @{member.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("backlog.bulkSprint")}</Label>
            <Select
              value={state.sprintId || "__unchanged__"}
              onValueChange={(value) => onChange({ ...state, sprintId: value === "__unchanged__" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("backlog.leaveUnchanged")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unchanged__">{t("backlog.leaveUnchanged")}</SelectItem>
                <SelectItem value="__clear__">{t("backlog.backlog")}</SelectItem>
                {sprintOptions.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onApply} disabled={!canPlanIssues || pending}>
            {pending ? t("common.saving") : t("backlog.applyBulkChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectBacklogPanel({
  projectId,
  onCreateIssue,
  selectedIssueId,
  onSelectedIssueChange,
}: {
  projectId: string;
  onCreateIssue?: () => void;
  selectedIssueId?: string | null;
  onSelectedIssueChange?: (issueId: string | null) => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const roleQ = useMyProjectRoleQuery(projectId);
  const membersQ = useProjectMembersQuery(projectId);
  const sprintsQ = useSprintsQuery(projectId);
  const backlogQ = useBacklogIssuesQuery(projectId);
  const createSprintMut = useCreateSprintMutation(projectId);
  const updateSprintMut = useUpdateSprintMutation(projectId);
  const startSprintMut = useStartSprintMutation(projectId);
  const completeSprintMut = useCompleteSprintMutation(projectId);
  const assignIssueMut = useAssignIssueToSprintMutation(projectId);
  const bulkUpdateIssuesMut = useBulkUpdateIssuesMutation(projectId);

  const sprints = sprintsQ.data ?? [];
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;
  const plannedSprints = sprints.filter((s) => s.status === "PLANNED");
  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");
  const assignableSprints = sprints.filter((s) => s.status !== "COMPLETED");

  const activeIssuesQ = useIssuesQuery(projectId, { sprintId: activeSprint?.id }, !!activeSprint?.id);
  const activeMetricsQ = useSprintMetricsQuery(projectId, activeSprint?.id, !!activeSprint?.id);

  const role = roleQ.data?.role;
  const canManageSprints = role === "OWNER" || role === "ADMIN";
  const canPlanIssues = role !== "VIEWER";
  const members = membersQ.data?.map((member) => ({ userId: member.userId, username: member.username })) ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [form, setForm] = useState<SprintFormState>(emptyForm());
  const [completeForm, setCompleteForm] = useState<CompleteSprintFormState>(emptyCompleteForm());
  const [bulkEdit, setBulkEdit] = useState<BulkEditState>(emptyBulkEdit());
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [dragOverSprintId, setDragOverSprintId] = useState<string | null>(null);

  const visibleIssues = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of backlogQ.data ?? []) map.set(issue.id, issue);
    for (const issue of activeIssuesQ.data ?? []) map.set(issue.id, issue);
    return Array.from(map.values());
  }, [activeIssuesQ.data, backlogQ.data]);

  useEffect(() => {
    setSelectedIssueIds((current) => current.filter((issueId) => visibleIssues.some((issue) => issue.id === issueId)));
  }, [visibleIssues]);

  useEffect(() => {
    if (!selectedIssueId) {
      if (selectedIssue) setSelectedIssue(null);
      return;
    }
    const match = visibleIssues.find((issue) => issue.id === selectedIssueId);
    if (match && selectedIssue?.id !== match.id) setSelectedIssue(match);
  }, [selectedIssue, selectedIssue?.id, selectedIssueId, visibleIssues]);

  useEffect(() => {
    if (completeDialogOpen && completeForm.completionAction === "MOVE_TO_SPRINT" && plannedSprints.length === 0) {
      setCompleteForm((current) => ({ ...current, completionAction: "MOVE_TO_BACKLOG", targetSprintId: "" }));
    }
  }, [completeDialogOpen, completeForm.completionAction, plannedSprints.length]);

  function openCreateSprint() {
    setEditingSprint(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEditSprint(sprint: Sprint) {
    setEditingSprint(sprint);
    setForm({
      name: sprint.name,
      goal: sprint.goal ?? "",
      description: sprint.description ?? "",
      startDate: sprint.startDate ?? "",
      endDate: sprint.endDate ?? "",
    });
    setDialogOpen(true);
  }

  function openCompleteSprintDialog() {
    setCompleteForm({
      completionAction: plannedSprints.length > 0 ? "MOVE_TO_SPRINT" : "MOVE_TO_BACKLOG",
      targetSprintId: plannedSprints[0]?.id ?? "",
    });
    setCompleteDialogOpen(true);
  }

  async function saveSprint() {
    try {
      const payload = normalizePayload(form);
      if (editingSprint) {
        await updateSprintMut.mutateAsync({ sprintId: editingSprint.id, payload });
        toast({ title: t("backlog.sprintUpdated") });
      } else {
        await createSprintMut.mutateAsync(payload);
        toast({ title: t("backlog.sprintCreated") });
      }
      setDialogOpen(false);
      setEditingSprint(null);
      setForm(emptyForm());
    } catch (e: unknown) {
      toast({
        title: editingSprint ? t("backlog.updateSprintFailed") : t("backlog.createSprintFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    }
  }

  async function changeIssueSprint(issueId: string, sprintId?: string | null) {
    try {
      await assignIssueMut.mutateAsync({ issueId, sprintId });
      toast({ title: sprintId ? t("backlog.issueAssigned") : t("backlog.issueMovedBack") });
    } catch (e: unknown) {
      toast({
        title: t("backlog.sprintAssignmentFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    } finally {
      setDraggingIssueId(null);
      setDragOverSprintId(null);
    }
  }

  function toggleIssueSelection(issueId: string, checked: boolean) {
    setSelectedIssueIds((current) =>
      checked ? Array.from(new Set([...current, issueId])) : current.filter((item) => item !== issueId)
    );
  }

  function toggleAllIssues(issues: Issue[], checked: boolean) {
    setSelectedIssueIds((current) => {
      const next = new Set(current);
      for (const issue of issues) {
        if (checked) next.add(issue.id);
        else next.delete(issue.id);
      }
      return Array.from(next);
    });
  }

  async function applyBulkChanges() {
    if (selectedIssueIds.length === 0) return;

    const payload: BulkUpdateIssuesPayload = { issueIds: selectedIssueIds };
    if (bulkEdit.status) payload.status = bulkEdit.status;
    if (bulkEdit.priority) payload.priority = bulkEdit.priority;
    if (bulkEdit.assigneeId === "__clear__") payload.clearAssignee = true;
    else if (bulkEdit.assigneeId) payload.assigneeId = bulkEdit.assigneeId;
    if (bulkEdit.sprintId === "__clear__") payload.clearSprint = true;
    else if (bulkEdit.sprintId) payload.sprintId = bulkEdit.sprintId;

    if (
      !payload.status &&
      !payload.priority &&
      !payload.assigneeId &&
      !payload.clearAssignee &&
      !payload.sprintId &&
      !payload.clearSprint
    ) {
      toast({ title: t("backlog.noBulkChangesSelected"), variant: "destructive" });
      return;
    }

    try {
      await bulkUpdateIssuesMut.mutateAsync(payload);
      toast({ title: t("backlog.bulkUpdateSuccess", { count: selectedIssueIds.length }) });
      setSelectedIssueIds([]);
      setBulkEdit(emptyBulkEdit());
    } catch (e: unknown) {
      toast({
        title: t("backlog.bulkUpdateFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    }
  }

  async function startSprint(sprintId: string) {
    try {
      await startSprintMut.mutateAsync(sprintId);
      toast({ title: t("backlog.sprintStarted") });
    } catch (e: unknown) {
      toast({
        title: t("backlog.startSprintFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    }
  }

  async function submitCompleteSprint() {
    if (!activeSprint) return;

    const payload: CompleteSprintPayload = {
      completionAction: completeForm.completionAction,
      targetSprintId: completeForm.completionAction === "MOVE_TO_SPRINT" ? completeForm.targetSprintId : null,
    };

    try {
      await completeSprintMut.mutateAsync({ sprintId: activeSprint.id, payload });
      toast({ title: t("backlog.sprintCompleted") });
      setCompleteDialogOpen(false);
      setCompleteForm(emptyCompleteForm());
    } catch (e: unknown) {
      toast({
        title: t("backlog.completeSprintFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    }
  }

  function handleDropToSprint(sprintId: string | null) {
    if (!draggingIssueId || !canPlanIssues || assignIssueMut.isPending) return;
    void changeIssueSprint(draggingIssueId, sprintId);
  }

  function handleDropZoneDragOver(event: DragEvent<HTMLDivElement>, sprintId: string) {
    if (!draggingIssueId) return;
    event.preventDefault();
    setDragOverSprintId(sprintId);
  }

  const isLoading = sprintsQ.isLoading || backlogQ.isLoading;

  return (
    <div className="space-y-6">
      {selectedIssueIds.length > 0 ? (
        <BulkIssueActionBar
          selectedCount={selectedIssueIds.length}
          members={members}
          sprintOptions={assignableSprints}
          canPlanIssues={canPlanIssues}
          pending={bulkUpdateIssuesMut.isPending}
          state={bulkEdit}
          onChange={setBulkEdit}
          onApply={applyBulkChanges}
          onClearSelection={() => {
            setSelectedIssueIds([]);
            setBulkEdit(emptyBulkEdit());
          }}
        />
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Rocket className="h-3.5 w-3.5" />
              {t("backlog.agilePlanning")}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{t("backlog.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("backlog.description")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCreateIssue ? (
              <Button variant="outline" onClick={onCreateIssue}>
                <Plus className="mr-2 h-4 w-4" />
                {t("common.newIssue")}
              </Button>
            ) : null}

            <Button onClick={openCreateSprint} disabled={!canManageSprints}>
              <Rocket className="mr-2 h-4 w-4" />
              {t("backlog.createSprint")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <SquareKanban className="h-5 w-5 text-primary" />
                  <CardTitle>{t("backlog.backlog")}</CardTitle>
                </div>
                <CardDescription>{t("backlog.backlogDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <IssuePlanningList
                  title={t("backlog.unplannedIssues")}
                  issues={backlogQ.data ?? []}
                  sprintOptions={assignableSprints}
                  canPlanIssues={canPlanIssues}
                  assignPending={assignIssueMut.isPending}
                  selectedIssueId={selectedIssueId}
                  selectedIssueIds={selectedIssueIds}
                  draggableIssues
                  onSelectIssue={(issue) => {
                    setSelectedIssue(issue);
                    onSelectedIssueChange?.(issue?.id ?? null);
                  }}
                  onToggleIssue={toggleIssueSelection}
                  onToggleAll={(checked) => toggleAllIssues(backlogQ.data ?? [], checked)}
                  onAssign={changeIssueSprint}
                  onDragIssueStart={setDraggingIssueId}
                  onDragIssueEnd={() => {
                    setDraggingIssueId(null);
                    setDragOverSprintId(null);
                  }}
                />
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  <CardTitle>{t("backlog.currentSprint")}</CardTitle>
                </div>
                <CardDescription>
                  {activeSprint ? t("backlog.currentSprintActiveDescription") : t("backlog.currentSprintEmptyDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSprint ? (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{activeSprint.name}</h3>
                          <Badge variant={sprintTone(activeSprint.status)}>{activeSprint.status}</Badge>
                          <Badge variant="outline">{t("backlog.issuesCount", { count: activeSprint.issueCount })}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-4 w-4" />
                            {formatDateRange(t, activeSprint.startDate, activeSprint.endDate)}
                          </span>
                        </div>
                        {activeSprint.goal ? (
                          <div className="rounded-xl border bg-background/70 px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">{t("backlog.goalLabel")}</span> {activeSprint.goal}
                          </div>
                        ) : null}
                        {activeSprint.description ? (
                          <p className="text-sm text-muted-foreground">{activeSprint.description}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => openEditSprint(activeSprint)} disabled={!canManageSprints}>
                          {t("common.edit")}
                        </Button>
                        <Button
                          onClick={openCompleteSprintDialog}
                          disabled={!canManageSprints || completeSprintMut.isPending}
                        >
                          {t("backlog.completeSprint")}
                        </Button>
                      </div>
                    </div>

                    <SprintMetricsCard
                      sprint={activeSprint}
                      metrics={activeMetricsQ.data}
                      dragActive={dragOverSprintId === activeSprint.id}
                      onDragOver={(event) => handleDropZoneDragOver(event, activeSprint.id)}
                      onDragLeave={() => setDragOverSprintId((current) => (current === activeSprint.id ? null : current))}
                      onDropIssue={() => handleDropToSprint(activeSprint.id)}
                    />

                    <IssuePlanningList
                      title={t("backlog.sprintScope")}
                      issues={activeIssuesQ.data ?? []}
                      sprintOptions={assignableSprints}
                      canPlanIssues={canPlanIssues}
                      assignPending={assignIssueMut.isPending}
                      selectedIssueId={selectedIssueId}
                      selectedIssueIds={selectedIssueIds}
                      onSelectIssue={(issue) => {
                        setSelectedIssue(issue);
                        onSelectedIssueChange?.(issue?.id ?? null);
                      }}
                      onToggleIssue={toggleIssueSelection}
                      onToggleAll={(checked) => toggleAllIssues(activeIssuesQ.data ?? [], checked)}
                      onAssign={changeIssueSprint}
                    />
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    {t("backlog.startPlannedSprintHint")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-primary" />
                  <CardTitle>{t("backlog.plannedSprints")}</CardTitle>
                </div>
                <CardDescription>{t("backlog.plannedSprintsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {plannedSprints.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    {t("backlog.noPlannedSprints")}
                  </div>
                ) : (
                  plannedSprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className={cn(
                        "rounded-2xl border p-4 transition-colors",
                        dragOverSprintId === sprint.id && "border-primary border-dashed bg-primary/5"
                      )}
                      onDragOver={(event) => handleDropZoneDragOver(event, sprint.id)}
                      onDragLeave={() => setDragOverSprintId((current) => (current === sprint.id ? null : current))}
                      onDrop={() => handleDropToSprint(sprint.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold">{sprint.name}</div>
                            <Badge variant={sprintTone(sprint.status)}>{sprint.status}</Badge>
                            <Badge variant="outline">{t("backlog.issuesCount", { count: sprint.issueCount })}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateRange(t, sprint.startDate, sprint.endDate)}
                          </div>
                          {sprint.goal ? (
                            <div className="text-sm text-foreground">{sprint.goal}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">{t("backlog.noSprintGoalYet")}</div>
                          )}
                          {dragOverSprintId === sprint.id ? (
                            <div className="rounded-xl border border-dashed px-3 py-2 text-sm text-primary">
                              {t("backlog.dropIssueHere")}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditSprint(sprint)} disabled={!canManageSprints}>
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startSprint(sprint.id)}
                            disabled={!canManageSprints || !!activeSprint || startSprintMut.isPending}
                          >
                            {t("backlog.startSprint")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  <CardTitle>{t("backlog.completedSprints")}</CardTitle>
                </div>
                <CardDescription>{t("backlog.completedSprintsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedSprints.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    {t("backlog.noSprintHistory")}
                  </div>
                ) : (
                  completedSprints.map((sprint, index) => {
                    const summary = getSprintMetricsSummary(sprint);
                    const targetSprintName = sprint.completedTargetSprintId
                      ? sprints.find((item) => item.id === sprint.completedTargetSprintId)?.name
                      : null;

                    return (
                      <div key={sprint.id}>
                        {index > 0 ? <Separator className="mb-3" /> : null}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{sprint.name}</div>
                            <Badge variant={sprintTone(sprint.status)}>{sprint.status}</Badge>
                            <Badge variant="outline">{t("backlog.issuesCount", { count: sprint.issueCount })}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateRange(t, sprint.startDate, sprint.endDate)}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border p-3">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.totalIssues")}</div>
                              <div className="mt-1 font-semibold">{summary.total}</div>
                            </div>
                            <div className="rounded-xl border p-3">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.doneIssues")}</div>
                              <div className="mt-1 font-semibold">{summary.done}</div>
                            </div>
                            <div className="rounded-xl border p-3">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("backlog.unfinishedIssues")}</div>
                              <div className="mt-1 font-semibold">{summary.unfinished}</div>
                            </div>
                          </div>
                          {sprint.completedAt ? (
                            <div className="text-xs text-muted-foreground">
                              {t("backlog.completedAt", { date: new Date(sprint.completedAt).toLocaleString() })}
                            </div>
                          ) : null}
                          {sprint.completionAction ? (
                            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {sprint.completionAction === "MOVE_TO_SPRINT"
                                ? t("backlog.historyMovedToSprint", { sprint: targetSprintName ?? t("backlog.anotherSprint") })
                                : t("backlog.historyMovedToBacklog")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <SprintDialog
        open={dialogOpen}
        title={editingSprint ? t("backlog.editSprintTitle") : t("backlog.createSprintTitle")}
        state={form}
        saving={createSprintMut.isPending || updateSprintMut.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingSprint(null);
            setForm(emptyForm());
          }
        }}
        onChange={setForm}
        onSubmit={saveSprint}
      />

      <CompleteSprintDialog
        open={completeDialogOpen}
        sprint={activeSprint}
        metrics={activeMetricsQ.data}
        plannedSprints={plannedSprints}
        state={completeForm}
        saving={completeSprintMut.isPending}
        onOpenChange={(open) => {
          setCompleteDialogOpen(open);
          if (!open) {
            setCompleteForm(emptyCompleteForm());
          }
        }}
        onChange={setCompleteForm}
        onSubmit={submitCompleteSprint}
      />

      <IssueDrawer
        projectId={projectId}
        issue={selectedIssue}
        open={!!selectedIssue}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIssue(null);
            onSelectedIssueChange?.(null);
          }
        }}
        members={members}
      />
    </div>
  );
}
