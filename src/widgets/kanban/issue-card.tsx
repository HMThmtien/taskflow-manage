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
      {...listeners}
      {...attributes}
      className={cn(
        "group relative block w-full max-w-full shrink-0 box-border cursor-grab overflow-hidden rounded-2xl border-white/70 bg-[linear-gradient(180deg,hsl(0_0%_100%/0.96),hsl(36_50%_98%/0.88))] p-3.5 shadow-[0_14px_28px_-26px_hsl(158_84%_18%/0.45)] transition-[box-shadow,border-color,background-color,opacity] duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_40px_-28px_hsl(158_84%_18%/0.4)] hover:bg-accent/30 active:cursor-grabbing dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(222_22%_17%/0.96),hsl(218_22%_13%/0.94))] dark:shadow-[0_22px_36px_-30px_hsl(0_0%_0%/0.6)] dark:hover:border-primary/30 dark:hover:bg-white/[0.04] dark:hover:shadow-[0_24px_44px_-28px_hsl(0_0%_0%/0.7)] will-change-transform",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isDragging && "opacity-0"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground transition-colors group-hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="shrink-0 rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
                  {key}
                </span>

                <IssueTypeBadge type={issue.type} />
                <div className="truncate text-sm font-semibold tracking-tight text-foreground">{issue.title}</div>
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/75 px-2 py-0.5 text-xs dark:border-white/10 dark:bg-white/[0.05]">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[9px]">{initials(assigneeName)}</AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate">{assigneeName}</span>
              </span>
            ) : null}

            {due ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/75 px-2 py-0.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
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
                <Badge key={label} variant="outline" className="bg-background/70 px-2 py-0.5 text-[11px] dark:border-white/10 dark:bg-white/[0.05]">
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

          <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {issue.description?.trim() ? issue.description : t("common.noDescription")}
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground dark:border-white/10">
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
