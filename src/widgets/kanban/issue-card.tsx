import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, ExternalLink, GitBranch, GripVertical, Paperclip, Tag } from "lucide-react";
import type { Issue } from "@/features/issues/api/issues.api";
import { useI18n } from "@/features/i18n/i18n";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";
import { IssueTypeBadge } from "@/widgets/issues/issue-type-badge";

function formatIssueKey(projectKey: string, issueId: string) {
  const s = String(issueId);
  const looksNumeric = /^\d+$/.test(s);
  return `${projectKey}-${looksNumeric ? s : s.slice(0, 6).toUpperCase()}`;
}

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const value = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return value || "U";
}

function formatDue(date?: string | null) {
  if (!date) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

export function IssueCard({
  issue,
  onClick,
  projectKey,
  assigneeName,
}: {
  issue: Issue;
  onClick: () => void;
  projectKey: string;
  assigneeName?: string | null;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id });

  const style: React.CSSProperties | undefined =
    isDragging && transform ? { transform: CSS.Transform.toString(transform) } : undefined;

  const key = formatIssueKey(projectKey, issue.id);
  const due = formatDue(issue.dueDate ?? null);
  const labels = (issue.labels ?? []).filter(Boolean);
  const displayLabels = labels.slice(0, 2);
  const extraLabels = labels.length - displayLabels.length;
  const isSubtask = issue.type === "SUBTASK";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative block w-full max-w-full shrink-0 box-border p-3 transition-colors hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isDragging && "opacity-0"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {key}
                </span>

                <IssueTypeBadge type={issue.type} />
                <div className="truncate text-sm font-medium">{issue.title}</div>
              </div>

              {isSubtask && issue.parentIssueTitle ? (
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span className="truncate">{t("board.subtaskOf", { title: issue.parentIssueTitle })}</span>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              title={t("board.open")}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={issue.status} />
            <PriorityBadge priority={issue.priority} />

            {assigneeName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[9px]">{initials(assigneeName)}</AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">{assigneeName}</span>
              </span>
            ) : null}

            {due ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {due}
              </span>
            ) : null}
          </div>

          {displayLabels.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Tag className="h-3 w-3" />
                {t("board.labels")}
              </span>
              {displayLabels.map((label) => (
                <Badge key={label} variant="outline" className="px-2 py-0.5 text-[11px]">
                  {label}
                </Badge>
              ))}
              {extraLabels > 0 ? (
                <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
                  +{extraLabels}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {issue.description?.trim() ? issue.description : t("common.noDescription")}
          </div>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            {isSubtask ? (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3 w-3" />
                {t("board.subtask")}
              </span>
            ) : null}

            {"attachmentCount" in issue &&
            typeof (issue as { attachmentCount?: number }).attachmentCount === "number" &&
            (issue as { attachmentCount?: number }).attachmentCount! > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {(issue as { attachmentCount?: number }).attachmentCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
