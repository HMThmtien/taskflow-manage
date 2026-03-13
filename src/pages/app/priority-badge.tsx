import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { useI18n } from "@/features/i18n/i18n";
import { cn } from "@/lib/utils";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n();
  const meta =
    priority === "HIGH"
      ? {
          label: t("priority.HIGH"),
          Icon: ArrowUp,
          cls: "bg-destructive/10 text-destructive border-destructive/20",
        }
      : priority === "LOW"
        ? {
            label: t("priority.LOW"),
            Icon: ArrowDown,
            cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
          }
        : {
            label: t("priority.MEDIUM"),
            Icon: ArrowRight,
            cls: "bg-amber-500/10 text-amber-700 border-amber-500/20",
          };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", meta.cls)}>
      <meta.Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
