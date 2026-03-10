import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, ExternalLink, GripVertical, Tag } from "lucide-react";
import { type Issue } from "@/features/issues/api/issues.api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function formatIssueKey(projectKey: string, issueId: string) {
  const s = String(issueId);
  const looksNumeric = /^\d+$/.test(s);
  return `${projectKey}-${looksNumeric ? s : s.slice(0, 6).toUpperCase()}`;
}

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const x = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return x || "U";
}

function formatDue(d?: string | null) {
  if (!d) return null;
  // Expect yyyy-mm-dd (from API), fallback to Date parse.
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });
  
  const style: React.CSSProperties | undefined =
  isDragging && transform ? { transform: CSS.Transform.toString(transform) } : undefined;

  const key = formatIssueKey(projectKey, issue.id);
  const due = formatDue(issue.dueDate ?? null);
  const labels = (issue.labels ?? []).filter(Boolean);
  const displayLabels = labels.slice(0, 2);
  const extraLabels = labels.length - displayLabels.length;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative block w-full max-w-full",
        "box-border",                 // ✅ tránh co do border/padding
        "shrink-0",                    // ✅ không bị flex shrink
        "p-3 transition-colors hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isDragging && "opacity-0"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle ONLY */}
        <button
          type="button"
          className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground rounded border px-1.5 py-0.5 shrink-0">
                  {key}
                </span>
                <div className="text-sm font-medium truncate">{issue.title}</div>
              </div>
            </div>

            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              title="Open"
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
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
                <Tag className="h-3 w-3" />
                Labels
              </span>
              {displayLabels.map((lb) => (
                <Badge key={lb} variant="outline" className="text-[11px] px-2 py-0.5">
                  {lb}
                </Badge>
              ))}
              {extraLabels > 0 ? (
                <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                  +{extraLabels}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {issue.description?.trim() ? issue.description : "No description"}
          </div>
        </div>
      </div>
    </Card>
  );
}