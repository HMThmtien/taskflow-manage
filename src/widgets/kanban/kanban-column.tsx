import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Inbox, Minus, MoreHorizontal, SortAsc } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/features/i18n/i18n";
import type { Issue } from "@/features/issues/api/issues.api";
import { cn } from "@/lib/utils";
import { IssueCard } from "./issue-card";

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
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id });
  const overLimit = wipLimit != null && items.length > wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={cn("rounded-xl bg-muted/20 transition-colors", isOver && "bg-primary/5 ring-2 ring-primary/40")}
    >
      <Card className="border-muted-foreground/10 bg-card/50 shadow-sm">
        <CardHeader className="sticky top-0 z-10 rounded-t-lg bg-card/60 pb-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
            <div className="min-w-0 flex items-center gap-2">
              <span className="truncate">{title}</span>
              <Badge variant="secondary" className={cn("px-2 py-0.5", overLimit && "bg-destructive/10 text-destructive")}>
                {items.length}
              </Badge>
              {wipLimit != null ? (
                <Badge
                  variant="outline"
                  className={cn("px-2 py-0.5", overLimit && "border-destructive/40 text-destructive")}
                >
                  {t("board.wip")} {wipLimit}
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
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {t("board.sortPosition")}
                  </span>
                  {sortBy === "position" ? <Badge variant="secondary">{t("common.on")}</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("priority")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {t("board.sortPriority")}
                  </span>
                  {sortBy === "priority" ? <Badge variant="secondary">{t("common.on")}</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("dueDate")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {t("board.sortDueDate")}
                  </span>
                  {sortBy === "dueDate" ? <Badge variant="secondary">{t("common.on")}</Badge> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeSortBy("updatedAt")} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    {t("board.sortRecentlyUpdated")}
                  </span>
                  {sortBy === "updatedAt" ? <Badge variant="secondary">{t("common.on")}</Badge> : null}
                </DropdownMenuItem>

                {typeof onToggleCollapsed === "function" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onToggleCollapsed} className="flex items-center gap-2">
                      {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {collapsed ? t("board.expandColumn") : t("board.collapseColumn")}
                    </DropdownMenuItem>
                  </>
                ) : null}

                {typeof onChangeWipLimit === "function" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">{t("board.wipLimit")}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onChangeWipLimit(null)} className="flex items-center gap-2">
                      <Minus className="h-4 w-4" />
                      {t("board.noLimit")}
                    </DropdownMenuItem>
                    {[3, 5, 8].map((value) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => onChangeWipLimit(value)}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {t("board.wip")} {value}
                        </span>
                        {wipLimit === value ? <Badge variant="secondary">{t("common.on")}</Badge> : null}
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>

        <CardContent
          className={cn(
            "min-h-[440px] max-h-[520px] overflow-y-auto overflow-x-hidden p-2 [scrollbar-gutter:stable]",
            collapsed && "max-h-[120px] min-h-[84px]"
          )}
        >
          {collapsed ? (
            <div className="flex h-[64px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <div className="text-xs">{t("board.collapsed")}</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
              <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-5 w-5" />
                <div className="text-sm font-medium">{t("board.noIssues")}</div>
                <div className="text-xs">{t("board.dropIssueHere")}</div>
              </div>
            </div>
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    <IssueCard
                      issue={item}
                      onClick={() => onSelect(item)}
                      projectKey={projectKey}
                      assigneeName={
                        item.assigneeUsername ??
                        (item.assigneeId ? memberNameById?.get(item.assigneeId) : null) ??
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
