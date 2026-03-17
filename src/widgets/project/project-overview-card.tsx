import { AlertTriangle, CheckCircle2, ListTodo, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummaryReport } from "@/features/reports/types/reports.types";

export function ProjectOverviewCard({
  summary,
  title = "Project overview",
  description = "A quick read on delivery health for this project.",
}: {
  summary: ProjectSummaryReport;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total issues</span>
            <ListTodo className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.totalIssues}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Open issues</span>
            <Timer className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.openIssues}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Done issues</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.doneIssues}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Overdue issues</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.overdueIssues}</div>
        </div>
      </CardContent>
    </Card>
  );
}
