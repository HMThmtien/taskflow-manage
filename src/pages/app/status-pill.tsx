import type { IssueStatus } from "@/features/issues/api/issues.api";
import { useI18n } from "@/features/i18n/i18n";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: IssueStatus }) {
  const { t } = useI18n();
  const meta =
    status === "TODO"
      ? { label: t("status.TODO"), cls: "bg-slate-500/10 text-slate-700 border-slate-500/20" }
      : status === "IN_PROGRESS"
        ? { label: t("status.IN_PROGRESS"), cls: "bg-blue-500/10 text-blue-700 border-blue-500/20" }
        : { label: t("status.DONE"), cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", meta.cls)}>
      {meta.label}
    </span>
  );
}
