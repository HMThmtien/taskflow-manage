import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type Priority = "low" | "medium" | "high";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta =
    priority === "high"
      ? { label: "High", Icon: ArrowUp, cls: "bg-destructive/10 text-destructive border-destructive/20" }
      : priority === "low"
        ? { label: "Low", Icon: ArrowDown, cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" }
        : { label: "Medium", Icon: ArrowRight, cls: "bg-amber-500/10 text-amber-700 border-amber-500/20" };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.cls)}>
      <meta.Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
