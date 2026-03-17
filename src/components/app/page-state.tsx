import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageState({
  kind,
  title,
  description,
  actionLabel,
  onAction,
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertTriangle : Inbox;

  return (
    <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-background">
        <Icon className={`h-5 w-5 ${kind === "loading" ? "animate-spin" : ""}`} />
      </div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {actionLabel && onAction ? (
        <div className="mt-5">
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
