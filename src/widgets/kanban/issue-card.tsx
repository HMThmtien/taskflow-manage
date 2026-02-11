import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical } from "lucide-react";
import { type Issue } from "@/features/issues/api/issues.api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/pages/app/priority-badge";
import { StatusPill } from "@/pages/app/status-pill";

export function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });

const style = transform
  ? { transform: CSS.Translate.toString(transform) }
  : undefined;


  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full p-3 transition-colors hover:bg-accent/40",
        isDragging && "opacity-0" // hoặc "opacity-20" nếu muốn còn bóng mờ
      )}
      
      
      onClick={onClick}
      role="button"
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
          {/* Title row + hover action */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{issue.title}</div>
            </div>

            {/* Open icon (hover) */}
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

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>

          {/* Description */}
          <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {issue.description?.trim() ? issue.description : "No description"}
          </div>
        </div>
      </div>
    </Card>
  );
}
