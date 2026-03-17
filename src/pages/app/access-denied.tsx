import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage({
  title = "Access denied",
  description = "You do not have permission to view this area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="mt-4 text-2xl font-semibold">{title}</div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/app/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link to="/app/projects">
            <Button variant="outline">View projects</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
