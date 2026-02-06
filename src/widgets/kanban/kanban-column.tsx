import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Issue } from "@/features/issues/api/issues.api";
import { IssueCard } from "./issue-card";
import { cn } from "@/lib/utils";

export function KanbanColumn({
  id,
  title,
  items,
  onSelect,
}: {
  id: string;
  title: string;
  items: Issue[];
  onSelect: (it: Issue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={cn("rounded-lg min-h-[520px]", isOver && "ring-2 ring-primary/40")}>
      <Card className="bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            <span className="text-muted-foreground">{items.length}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 min-h-[440px]">
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 text-center">
              Drop issues here
            </div>
          )}
          {items.map((it) => (
            <IssueCard key={it.id} issue={it} onClick={() => onSelect(it)} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
