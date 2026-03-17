import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, RefreshCcw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsQuery } from "@/features/projects/api/projects.queries";
import {
  useProjectSprintProgressReportQuery,
  useProjectSummaryReportQuery,
  useProjectWorkloadReportQuery,
} from "@/features/reports/api/reports.queries";
import { ProjectOverviewCard } from "@/widgets/project/project-overview-card";

export default function DashboardPage() {
  const projectsQ = useProjectsQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    if (!selectedProjectId && projectsQ.data?.length) {
      setSelectedProjectId(projectsQ.data[0].id);
    }
  }, [projectsQ.data, selectedProjectId]);

  const selectedProject = useMemo(
    () => projectsQ.data?.find((project) => project.id === selectedProjectId) ?? null,
    [projectsQ.data, selectedProjectId]
  );

  const summaryQ = useProjectSummaryReportQuery(selectedProjectId);
  const workloadQ = useProjectWorkloadReportQuery(selectedProjectId);
  const sprintQ = useProjectSprintProgressReportQuery(selectedProjectId);

  const statusChart = useMemo(
    () => (summaryQ.data?.issuesByStatus ?? []).map((item) => ({ name: item.key.replaceAll("_", " "), count: item.count })),
    [summaryQ.data?.issuesByStatus]
  );

  const priorityChart = useMemo(
    () => (summaryQ.data?.issuesByPriority ?? []).map((item) => ({ name: item.key, count: item.count })),
    [summaryQ.data?.issuesByPriority]
  );

  const isLoading = projectsQ.isLoading || summaryQ.isLoading || workloadQ.isLoading || sprintQ.isLoading;

  if (projectsQ.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>;
  }

  if (projectsQ.isError || !projectsQ.data?.length) {
    return <div className="rounded-xl border p-6 text-sm text-muted-foreground">No projects available for dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
            <div className="text-sm text-muted-foreground">Practical delivery signals for leads and managers.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projectsQ.data.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                void projectsQ.refetch();
                void summaryQ.refetch();
                void workloadQ.refetch();
                void sprintQ.refetch();
              }}
              disabled={isLoading}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {summaryQ.data ? (
        <ProjectOverviewCard
          summary={summaryQ.data}
          title={selectedProject ? `${selectedProject.name} overview` : "Project overview"}
          description="A fast read on issue volume, execution flow, and risk."
        />
      ) : (
        <Skeleton className="h-48 w-full" />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Issues by status</CardTitle>
            <CardDescription>Current distribution of work in the selected project.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {summaryQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChart}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Issues by priority</CardTitle>
            <CardDescription>Useful for spotting urgent load versus normal flow.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {summaryQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChart}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overdue issues</CardTitle>
            <CardDescription>All overdue calculations use UTC date boundaries in the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryQ.isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : summaryQ.data && summaryQ.data.overdueItems.length > 0 ? (
              summaryQ.data.overdueItems.map((issue) => (
                <div key={issue.issueId} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {issue.priority} • {issue.status} • Due {issue.dueDate}
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {issue.assigneeUsername ? `@${issue.assigneeUsername}` : "Unassigned"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No overdue issues in this project.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Active sprint progress</CardTitle>
            <CardDescription>Focused view of the currently active sprint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sprintQ.isLoading ? (
              <>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full" />
              </>
            ) : sprintQ.data?.activeSprint ? (
              <>
                <div>
                  <div className="font-medium">{sprintQ.data.activeSprint.sprintName}</div>
                  <div className="text-sm text-muted-foreground">
                    {sprintQ.data.activeSprint.doneIssues}/{sprintQ.data.activeSprint.totalIssues} done
                  </div>
                </div>
                <Progress value={sprintQ.data.activeSprint.completionPercent} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Done</div>
                    <div className="mt-1 text-xl font-semibold">{sprintQ.data.activeSprint.doneIssues}</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">In progress</div>
                    <div className="mt-1 text-xl font-semibold">{sprintQ.data.activeSprint.inProgressIssues}</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Todo</div>
                    <div className="mt-1 text-xl font-semibold">{sprintQ.data.activeSprint.todoIssues}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No active sprint for this project.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Assignee workload</CardTitle>
          <CardDescription>Open work and overdue load per assignee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workloadQ.isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : workloadQ.data?.items.length ? (
            workloadQ.data.items.map((item) => (
              <div key={item.userId} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border p-2">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{item.fullName || item.username}</div>
                    <div className="text-sm text-muted-foreground">@{item.username}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Assigned</div>
                    <div className="font-semibold">{item.totalAssigned}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Open</div>
                    <div className="font-semibold">{item.openAssigned}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Overdue</div>
                    <div className="font-semibold">{item.overdueAssigned}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No assignee workload yet for this project.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
