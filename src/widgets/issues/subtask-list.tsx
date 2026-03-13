import type { Issue } from "@/features/issues/api/issues.api";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/features/i18n/i18n";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";

export function SubtaskList({
  items,
  onToggleDone,
}: {
  items: Issue[];
  onToggleDone?: (issue: Issue, checked: boolean) => void;
}) {
  const { t } = useI18n();

  if (!items.length) {
    return <div className="text-sm text-muted-foreground">{t("issue.noSubtasksYet")}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const checked = item.status === "DONE";

        return (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox checked={checked} onCheckedChange={(v) => onToggleDone?.(item, !!v)} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <IssueTypeBadge type={item.type} />
                <div className="truncate text-sm font-medium">{item.title}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(`priority.${item.priority}`)} · {t(`status.${item.status}`)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
