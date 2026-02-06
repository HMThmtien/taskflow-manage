import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { type Issue } from "@/features/issues/api/issues.api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn("p-3", isDragging && "opacity-70")}
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
          <div className="text-sm font-medium">{issue.title}</div>
          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {issue.description ?? "No description"}
          </div>
        </div>
      </div>
    </Card>
  );
}
