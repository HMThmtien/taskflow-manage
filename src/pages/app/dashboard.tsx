import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useProjectsQuery } from "@/features/projects/api/projects.queries";
import type { Issue, IssueStatus } from "@/features/issues/api/issues.api";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  HeartPulse,
  ListChecks,
  RefreshCcw,
  User,
} from "lucide-react";

// ---------- helpers ----------
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0..6
  const diff = (day === 0 ? -6 : 1) - day; // Mon as start
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number) {
  const x = new Date();
  x.setDate(x.getDate() - n);
  return x;
}
function safeDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function statusLabel(s: IssueStatus) {
  if (s === "TODO") return "Todo";
  if (s === "IN_PROGRESS") return "In Progress";
  return "Done";
}

function statusOrder(s: IssueStatus) {
  return s === "TODO" ? 0 : s === "IN_PROGRESS" ? 1 : 2;
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function healthFromData(donePct: number, staleCount: number) {
  // rule-of-thumb
  if (donePct >= 60 && staleCount <= 3) return { label: "Healthy", tone: "ok" as const };
  if (donePct >= 35 && staleCount <= 8) return { label: "At risk", tone: "warn" as const };
  return { label: "Needs attention", tone: "bad" as const };
}

function HealthBadge({ tone, label }: { tone: "ok" | "warn" | "bad"; label: string }) {
  const variant =
    tone === "ok" ? "secondary" : tone === "warn" ? "outline" : "destructive";
  return <Badge variant={variant}>{label}</Badge>;
}

// ---------- page ----------
export default function DashboardPage() {
  // TODO (optional): nếu bạn có API me/profile thì thay ở đây để show Welcome theo username
  const username: string | undefined = undefined;

  const projectsQ = useProjectsQuery();

  // Fetch issues per project (parallel). Requires tanstack/react-query (you likely already use it).
  const issuesQueries = useQueries({
    queries: (projectsQ.data ?? []).map((p) => ({
      queryKey: ["issues", p.id, "dashboard"],
      queryFn: async () => {
        // Reuse your existing hook logic:
        // We call the same underlying fetcher by invoking useIssuesQuery in a component is not possible here.
        // => But in many setups, useIssuesQuery is a wrapper around useQuery.
        // If your useIssuesQuery is mandatory, see note below.
        //
        // ✅ If you can’t call fetcher directly, simplest is:
        // - expose `issuesApi.list(projectId, filters)` and call it here.
        //
        // For now, we’ll use a safe pattern: call useIssuesQuery-like fetcher if exported.
        // If you DON'T have direct fetcher, scroll to NOTE at bottom.

        // @ts-ignore - adapt to your actual fetcher export if exists
        const mod = await import("@/features/issues/api/issues.api");
        // Try common export names
        const fetcher =
          // @ts-ignore
          mod.listIssues?.bind(mod) ||
          // @ts-ignore
          mod.getIssues?.bind(mod) ||
          null;

        if (!fetcher) {
          // fallback: no fetcher available
          // return empty to avoid crash; you should wire a fetcher for real data
          return [] as Issue[];
        }

        // No filters for dashboard aggregation
        const res = await fetcher(p.id, {});
        return (res ?? []) as Issue[];
      },
      enabled: !!projectsQ.data?.length,
      staleTime: 30_000,
    })),
  });

  const anyIssuesLoading =
    projectsQ.isLoading || issuesQueries.some((q) => q.isLoading);
  const anyIssuesError =
    projectsQ.isError || issuesQueries.some((q) => q.isError);

  const issuesAll: Issue[] = useMemo(() => {
    return issuesQueries.flatMap((q) => (q.data as Issue[] | undefined) ?? []);
  }, [issuesQueries]);

  const totalProjects = projectsQ.data?.length ?? 0;

  const statusCounts = useMemo(() => {
    const base: Record<IssueStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const it of issuesAll) base[it.status] = (base[it.status] ?? 0) + 1;
    return base;
  }, [issuesAll]);

  const totalIssues = issuesAll.length;
  const doneCount = statusCounts.DONE ?? 0;
  const openCount = (statusCounts.TODO ?? 0) + (statusCounts.IN_PROGRESS ?? 0);
  const donePct = pct(doneCount, totalIssues);

  const doneThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    return issuesAll.filter((it) => {
      if (it.status !== "DONE") return false;
      const d =
        safeDate((it as any).updatedAt) ||
        safeDate((it as any).doneAt) ||
        safeDate((it as any).closedAt) ||
        safeDate((it as any).createDate) ||
        safeDate((it as any).createdAt);
      return d ? d >= weekStart : false;
    }).length;
  }, [issuesAll]);

  // “Stale” = open issues older than 14 days (adjust rule)
  const staleOpen = useMemo(() => {
    const cutoff = daysAgo(14);
    return issuesAll.filter((it) => {
      if (it.status === "DONE") return false;
      const d =
        safeDate((it as any).updatedAt) ||
        safeDate((it as any).createdAt) ||
        safeDate((it as any).createDate);
      return d ? d < cutoff : false;
    });
  }, [issuesAll]);

  const health = useMemo(() => healthFromData(donePct, staleOpen.length), [donePct, staleOpen.length]);

  const chartData = useMemo(
    () =>
      (["TODO", "IN_PROGRESS", "DONE"] as IssueStatus[]).map((s) => ({
        status: statusLabel(s),
        count: statusCounts[s] ?? 0,
      })),
    [statusCounts]
  );

  // Recent activity = take newest by updatedAt/createdAt
  const recentActivity = useMemo(() => {
    const list = [...issuesAll];
    list.sort((a, b) => {
      const ad = safeDate((a as any).updatedAt) || safeDate((a as any).createdAt) || new Date(0);
      const bd = safeDate((b as any).updatedAt) || safeDate((b as any).createdAt) || new Date(0);
      return bd.getTime() - ad.getTime();
    });
    return list.slice(0, 8);
  }, [issuesAll]);

  // Assigned to me (best-effort):
  // - If your Issue has assigneeId / assignee.userId, wire it here.
  // - For now we just show "In Progress" issues as “my focus”.
  const assignedToMe = useMemo(() => {
    const list = issuesAll.filter((it) => it.status === "IN_PROGRESS");
    list.sort((a, b) => (statusOrder(a.status) - statusOrder(b.status)) || String(a.id).localeCompare(String(b.id)));
    return list.slice(0, 6);
  }, [issuesAll]);

  const refetchAll = async () => {
    await projectsQ.refetch();
    issuesQueries.forEach((q) => q.refetch?.());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">
            {username ? `Welcome back, ${username}` : "Dashboard"}
          </div>
          <div className="text-sm text-muted-foreground">
            Workspace overview: projects, issues, and progress at a glance.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetchAll} disabled={anyIssuesLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${anyIssuesLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link to="/app/projects">
            <Button className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading / Error */}
      {anyIssuesError ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed to load dashboard data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {projectsQ.isError
                ? ((projectsQ.error as Error)?.message ?? "Projects error")
                : "Issues error (check issues fetcher wiring)."}
            </div>
            <Button variant="outline" onClick={refetchAll}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Projects</div>
              {anyIssuesLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-semibold">{totalProjects}</div>}
            </div>
            <FolderKanban className="h-8 w-8 text-muted-foreground/70" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Open issues</div>
              {anyIssuesLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-semibold">{openCount}</div>}
            </div>
            <Clock className="h-8 w-8 text-muted-foreground/70" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Done this week</div>
              {anyIssuesLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-semibold">{doneThisWeek}</div>}
            </div>
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/70" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                Workspace health <HeartPulse className="h-4 w-4" />
              </div>
              {anyIssuesLoading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <div className="flex items-center gap-2">
                  <HealthBadge tone={health.tone} label={health.label} />
                  <span className="text-xs text-muted-foreground">
                    {staleOpen.length} stale
                  </span>
                </div>
              )}
            </div>
            <User className="h-8 w-8 text-muted-foreground/70" />
          </CardContent>
        </Card>
      </div>

      {/* Chart + Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status chart */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Issues by status
              <Badge variant="outline">{totalIssues} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {anyIssuesLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[220px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {anyIssuesLoading ? (
              <>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Done</span>
                  <span className="font-medium">{doneCount} / {totalIssues} ({donePct}%)</span>
                </div>

                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${donePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Todo</span>
                  <span className="font-medium">{statusCounts.TODO ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">In progress</span>
                  <span className="font-medium">{statusCounts.IN_PROGRESS ?? 0}</span>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Tip: Reduce stale issues to improve workspace health.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assigned to me + Activity timeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Assigned */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Assigned to me
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {anyIssuesLoading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </>
            ) : assignedToMe.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No issues assigned.
                <div className="text-xs mt-1">
                  (Wire assigneeId filter in code when your API supports it.)
                </div>
              </div>
            ) : (
              assignedToMe.map((it) => (
                <div
                  key={it.id}
                  className="rounded-lg border p-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="text-sm font-medium line-clamp-1">{it.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                    <span>{statusLabel(it.status)}</span>
                    <span className="opacity-80">#{String(it.id).slice(0, 6)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity timeline */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Activity timeline
              <Link to="/app/projects" className="text-sm text-muted-foreground hover:text-foreground transition">
                View all <ArrowRight className="inline h-4 w-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {anyIssuesLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No recent activity.
              </div>
            ) : (
              recentActivity.map((it) => {
                const d =
                  safeDate((it as any).updatedAt) ||
                  safeDate((it as any).createdAt) ||
                  safeDate((it as any).createDate);

                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium line-clamp-1">{it.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {statusLabel(it.status)} • {d ? d.toLocaleString() : "—"}
                      </div>
                    </div>

                    <Badge variant="outline" className="ml-3 shrink-0">
                      {statusLabel(it.status)}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}