import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Flag, Layers3, PlayCircle, Plus, Rocket, SquareKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Issue } from "@/features/issues/api/issues.api";
import { useIssuesQuery } from "@/features/issues/api/issues.queries";
import { useI18n } from "@/features/i18n/i18n";
import { useMyProjectRoleQuery, useProjectMembersQuery } from "@/features/project-members/api/project-members.queries";
import type { Sprint, SprintPayload } from "@/features/sprints/api/sprints.api";
import {
  useAssignIssueToSprintMutation,
  useBacklogIssuesQuery,
  useCompleteSprintMutation,
  useCreateSprintMutation,
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

function emptyForm(): SprintFormState {
  return { name: "", goal: "", description: "", startDate: "", endDate: "" };
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

function IssuePlanningList({
  title,
  issues,
  sprintOptions,
  canPlanIssues,
  assignPending,
  selectedIssueId,
  onSelectIssue,
  onAssign,
}: {
  title: string;
  issues: Issue[];
  sprintOptions: Sprint[];
  canPlanIssues: boolean;
  assignPending: boolean;
  selectedIssueId?: string | null;
  onSelectIssue: (issue: Issue | null) => void;
  onAssign: (issueId: string, sprintId?: string | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
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
              className={cn(
                "rounded-xl border bg-card/70 p-3 transition-colors",
                selectedIssueId === issue.id ? "border-primary/40 ring-1 ring-primary/20" : "hover:bg-accent/30"
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

  const sprints = sprintsQ.data ?? [];
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;
  const plannedSprints = sprints.filter((s) => s.status === "PLANNED");
  const completedSprints = sprints.filter((s) => s.status === "COMPLETED");
  const assignableSprints = sprints.filter((s) => s.status !== "COMPLETED");

  const activeIssuesQ = useIssuesQuery(projectId, { sprintId: activeSprint?.id }, !!activeSprint?.id);

  const role = roleQ.data?.role;
  const canManageSprints = role === "OWNER" || role === "ADMIN";
  const canPlanIssues = role !== "VIEWER";
  const members = membersQ.data?.map((member) => ({ userId: member.userId, username: member.username })) ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [form, setForm] = useState<SprintFormState>(emptyForm());
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const visibleIssues = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of backlogQ.data ?? []) map.set(issue.id, issue);
    for (const issue of activeIssuesQ.data ?? []) map.set(issue.id, issue);
    return Array.from(map.values());
  }, [activeIssuesQ.data, backlogQ.data]);

  useEffect(() => {
    if (!selectedIssueId) return;
    const match = visibleIssues.find((issue) => issue.id === selectedIssueId);
    if (match && selectedIssue?.id !== match.id) setSelectedIssue(match);
  }, [selectedIssue?.id, selectedIssueId, visibleIssues]);

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

  async function completeSprint(sprintId: string) {
    try {
      await completeSprintMut.mutateAsync(sprintId);
      toast({ title: t("backlog.sprintCompleted") });
    } catch (e: unknown) {
      toast({
        title: t("backlog.completeSprintFailed"),
        description: e instanceof Error ? e.message : t("issue.unknownError"),
        variant: "destructive",
      });
    }
  }

  const isLoading = sprintsQ.isLoading || backlogQ.isLoading;

  return (
    <div className="space-y-6">
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
                  onSelectIssue={(issue) => {
                    setSelectedIssue(issue);
                    onSelectedIssueChange?.(issue?.id ?? null);
                  }}
                  onAssign={changeIssueSprint}
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
                    <div className="rounded-2xl border bg-primary/[0.04] p-4">
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
                            onClick={() => completeSprint(activeSprint.id)}
                            disabled={!canManageSprints || completeSprintMut.isPending}
                          >
                            {t("backlog.completeSprint")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <IssuePlanningList
                      title={t("backlog.sprintScope")}
                      issues={activeIssuesQ.data ?? []}
                      sprintOptions={assignableSprints}
                      canPlanIssues={canPlanIssues}
                      assignPending={assignIssueMut.isPending}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={(issue) => {
                        setSelectedIssue(issue);
                        onSelectedIssueChange?.(issue?.id ?? null);
                      }}
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
                    <div key={sprint.id} className="rounded-2xl border p-4">
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
                  completedSprints.map((sprint, index) => (
                    <div key={sprint.id}>
                      {index > 0 ? <Separator className="mb-3" /> : null}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{sprint.name}</div>
                          <Badge variant={sprintTone(sprint.status)}>{sprint.status}</Badge>
                          <Badge variant="outline">{t("backlog.issuesCount", { count: sprint.issueCount })}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateRange(t, sprint.startDate, sprint.endDate)}
                        </div>
                        {sprint.completedAt ? (
                          <div className="text-xs text-muted-foreground">
                            {t("backlog.completedAt", { date: new Date(sprint.completedAt).toLocaleString() })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
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
