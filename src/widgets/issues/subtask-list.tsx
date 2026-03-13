import type { Issue } from "@/features/issues/api/issues.api";
import { Checkbox } from "@/components/ui/checkbox";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";

export function SubtaskList({
  items,
  onToggleDone,
}: {
  items: Issue[];
  onToggleDone?: (issue: Issue, checked: boolean) => void;
}) {
  if (!items.length) {
    return <div className="text-sm text-muted-foreground">No subtasks yet</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const checked = item.status === "DONE";

        return (
          <div
            key={item.id}
            className="rounded-lg border p-3 flex items-center gap-3"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => onToggleDone?.(item, !!v)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <IssueTypeBadge type={item.type} />
                <div className="text-sm font-medium truncate">{item.title}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.priority} · {item.status}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}