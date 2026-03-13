import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IssueType } from "@/features/issues/api/issues.api";

const labelMap: Record<IssueType, string> = {
  TASK: "Task",
  BUG: "Bug",
  STORY: "Story",
  EPIC: "Epic",
  SUBTASK: "Subtask",
};

const classMap: Record<IssueType, string> = {
  TASK: "border-slate-300 text-slate-700 dark:text-slate-300",
  BUG: "border-red-300 text-red-700 dark:text-red-300",
  STORY: "border-blue-300 text-blue-700 dark:text-blue-300",
  EPIC: "border-violet-300 text-violet-700 dark:text-violet-300",
  SUBTASK: "border-amber-300 text-amber-700 dark:text-amber-300",
};

export function IssueTypeBadge({ type }: { type?: IssueType | null }) {
  if (!type) return null;

  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] px-2 py-0.5", classMap[type])}
    >
      {labelMap[type]}
    </Badge>
  );
}