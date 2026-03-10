import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Issue } from "@/features/issues/api/issues.api";
import { IssueCard } from "./issue-card";
import { cn } from "@/lib/utils";
import { Inbox, MoreHorizontal, SortAsc, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export function KanbanColumn({
  id,
  title,
  items,
  onSelect,
  projectKey,
  memberNameById,
  sortBy,
  onChangeSortBy,
  wipLimit,
  onChangeWipLimit,
  collapsed,
  onToggleCollapsed,
}: {
  id: string;
  title: string;
  items: Issue[];
  onSelect: (it: Issue) => void;
  projectKey: string;
  memberNameById?: Map<string, string>;
  sortBy: "position" | "priority" | "dueDate" | "updatedAt";
  onChangeSortBy: (v: "position" | "priority" | "dueDate" | "updatedAt") => void;
  wipLimit: number | null;
  onChangeWipLimit?: (v: number | null) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const overLimit = wipLimit != null && items.length > wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-colors bg-muted/20",
        isOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <Card className="bg-card/50 border-muted-foreground/10 shadow-sm">
        {/* Sticky header */}
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 rounded-t-lg">
          <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{title}</span>
              <Badge variant="secondary" className={cn("px-2 py-0.5", overLimit && "bg-destructive/10 text-destructive")}>
                {items.length}
              </Badge>
              {wipLimit != null ? (
                <Badge variant="outline" className={cn("px-2 py-0.5", overLimit && "border-destructive/40 text-destructive")}>
                  WIP {wipLimit}
                </Badge>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onChangeSortBy("position")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><SortAsc className="h-4 w-4" /> Sort: Position</span>
                  {sortBy === "position" ? <Badge variant="secondary">On</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("priority")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><SortAsc className="h-4 w-4" /> Sort: Priority</span>
                  {sortBy === "priority" ? <Badge variant="secondary">On</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("dueDate")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><SortAsc className="h-4 w-4" /> Sort: Due date</span>
                  {sortBy === "dueDate" ? <Badge variant="secondary">On</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("updatedAt")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><SortAsc className="h-4 w-4" /> Sort: Recently updated</span>
                  {sortBy === "updatedAt" ? <Badge variant="secondary">On</Badge> : null}
                </DropdownMenuItem>

                {typeof onToggleCollapsed === "function" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onToggleCollapsed} className="flex items-center gap-2">
                      {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {collapsed ? "Expand column" : "Collapse column"}
                    </DropdownMenuItem>
                  </>
                ) : null}

                {typeof onChangeWipLimit === "function" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">WIP limit</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onChangeWipLimit(null)} className="flex items-center gap-2">
                      <Minus className="h-4 w-4" /> No limit
                    </DropdownMenuItem>
                    {[3, 5, 8].map((n) => (
                      <DropdownMenuItem key={n} onClick={() => onChangeWipLimit(n)} className="flex items-center justify-between">
                        <span>WIP {n}</span>
                        {wipLimit === n ? <Badge variant="secondary">On</Badge> : null}
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>

        {/* Scrollable content */}
        <CardContent
          className={cn(
            "min-h-[440px] max-h-[520px] overflow-y-auto overflow-x-hidden p-2 [scrollbar-gutter:stable]",
            collapsed && "min-h-[84px] max-h-[120px]"
          )}
        >
          {collapsed ? (
            <div className="flex h-[64px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <div className="text-xs">Collapsed</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-5 w-5" />
                <div className="text-sm font-medium">No issues</div>
                <div className="text-xs">Drop an issue here</div>
              </div>
            </div>
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    <IssueCard
                      issue={it}
                      onClick={() => onSelect(it)}
                      projectKey={projectKey}
                      assigneeName={
                        it.assigneeUsername ??
                        (it.assigneeId ? memberNameById?.get(it.assigneeId) : null) ??
                        null
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
