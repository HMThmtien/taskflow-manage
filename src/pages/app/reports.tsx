import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsQuery } from "@/features/projects/api/projects.queries";
import {
  useProjectSprintProgressReportQuery,
  useProjectSummaryReportQuery,
  useProjectWorkloadReportQuery,
} from "@/features/reports/api/reports.queries";
import { ProjectOverviewCard } from "@/widgets/project/project-overview-card";

export default function ReportsPage() {
  const projectsQ = useProjectsQuery();
  const [selectedProjectId, setSelectedProjectId] = useState("");

  useEffect(() => {
    if (!selectedProjectId && projectsQ.data?.length) {
      setSelectedProjectId(projectsQ.data[0].id);
    }
  }, [projectsQ.data, selectedProjectId]);

  const summaryQ = useProjectSummaryReportQuery(selectedProjectId);
  const workloadQ = useProjectWorkloadReportQuery(selectedProjectId);
  const sprintQ = useProjectSprintProgressReportQuery(selectedProjectId);

  const selectedProject = useMemo(
    () => projectsQ.data?.find((project) => project.id === selectedProjectId) ?? null,
    [projectsQ.data, selectedProjectId]
  );

  if (projectsQ.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!projectsQ.data?.length) {
    return <div className="rounded-xl border p-6 text-sm text-muted-foreground">No projects available for reports.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Reports</h1>
            <p className="text-sm text-muted-foreground">Basic project reporting for managers and team leads.</p>
          </div>

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
        </CardContent>
      </Card>

      {summaryQ.data ? (
        <ProjectOverviewCard
          summary={summaryQ.data}
          title={`${selectedProject?.name ?? "Project"} summary`}
          description="Project-level reporting built from aggregated backend queries."
        />
      ) : (
        <Skeleton className="h-48 w-full" />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>How the current issue pool is spread across delivery states.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {summaryQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryQ.data?.issuesByStatus ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="key" />
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
            <CardTitle>Priority distribution</CardTitle>
            <CardDescription>Useful for seeing whether urgent work is crowding out the rest.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {summaryQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryQ.data?.issuesByPriority ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="key" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Active sprint</CardTitle>
            <CardDescription>Current sprint execution health for the selected project.</CardDescription>
          </CardHeader>
          <CardContent>
            {sprintQ.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : sprintQ.data?.activeSprint ? (
              <div className="space-y-3">
                <div className="font-medium">{sprintQ.data.activeSprint.sprintName}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Completion</div>
                    <div className="mt-1 text-2xl font-semibold">{sprintQ.data.activeSprint.completionPercent}%</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-muted-foreground">Unfinished</div>
                    <div className="mt-1 text-2xl font-semibold">{sprintQ.data.activeSprint.unfinishedIssues}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No active sprint in this project.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Team workload</CardTitle>
            <CardDescription>Assigned load by person, with open and overdue pressure visible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workloadQ.isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : workloadQ.data?.items.length ? (
              workloadQ.data.items.map((item) => (
                <div key={item.userId} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.fullName || item.username}</div>
                      <div className="text-sm text-muted-foreground">@{item.username}</div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
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
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No assignee data yet for this project.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
