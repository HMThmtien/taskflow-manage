import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["Projects", "Open issues", "Done this week"].map((t) => (
          <Card key={t}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">—</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
