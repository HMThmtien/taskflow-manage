import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Issue } from "@/features/issues/api/issues.api";
import { IssueCard } from "./issue-card";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

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
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-colors",
        isOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <Card className="bg-card/40">
        {/* Sticky header */}
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 rounded-t-lg">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            <span className="text-muted-foreground">{items.length}</span>
          </CardTitle>
        </CardHeader>

        {/* Scrollable content */}
        <CardContent className="min-h-[440px] max-h-[520px] overflow-y-auto overflow-x-visible space-y-2 pr-2">
          {items.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-5 w-5" />
                <div className="text-sm font-medium">No issues</div>
                <div className="text-xs">Drop an issue here</div>
              </div>
            </div>
          ) : (
            items.map((it) => (
              <IssueCard key={it.id} issue={it} onClick={() => onSelect(it)} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
