import { useDroppable } from "@dnd-kit/core";
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
      className={cn(
        "rounded-[26px] border border-white/60 bg-white/30 p-1.5 transition-colors dark:border-white/10 dark:bg-white/[0.03]",
        isOver && "bg-primary/10 ring-2 ring-primary/30 dark:bg-primary/12"
      )}
    >
      <Card className="surface-panel-dark overflow-hidden rounded-[22px] border-border/50 bg-card/70 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(222_24%_14%/0.96),hsl(218_24%_11%/0.92))] dark:shadow-[0_24px_40px_-30px_hsl(0_0%_0%/0.55)]">
        <CardHeader className="sticky top-0 z-10 border-b border-border/40 bg-[linear-gradient(180deg,hsl(var(--card)/0.96),hsl(var(--card)/0.86))] pb-3 backdrop-blur supports-[backdrop-filter]:bg-card/75 dark:border-white/10 dark:bg-[linear-gradient(180deg,hsl(222_22%_17%/0.94),hsl(218_22%_14%/0.84))] dark:supports-[backdrop-filter]:bg-[linear-gradient(180deg,hsl(222_22%_17%/0.82),hsl(218_22%_14%/0.72))]">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium">
            <div className="min-w-0 flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-tight">{title}</span>
              <Badge variant="secondary" className={cn("px-2 py-0.5 shadow-sm", overLimit && "bg-destructive/10 text-destructive")}>
                {items.length}
              </Badge>
              {wipLimit != null ? (
                <Badge
                  variant="outline"
                  className={cn("px-2 py-0.5 bg-background/70 dark:bg-white/5", overLimit && "border-destructive/40 text-destructive")}
                >
                  {t("board.wip")} {wipLimit}
                </Badge>
              ) : null}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-white/8">
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
            "min-h-[460px] max-h-[560px] overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,hsl(var(--muted)/0.08),transparent_24%)] p-3 [scrollbar-gutter:stable] dark:bg-[linear-gradient(180deg,hsl(220_20%_16%/0.42),transparent_24%)]",
            collapsed && "max-h-[120px] min-h-[84px]"
          )}
        >
          {collapsed ? (
            <div className="flex h-[64px] items-center justify-center rounded-xl border border-dashed text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-xs">{t("board.collapsed")}</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed bg-background/60 text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-5 w-5 text-primary/70" />
                <div className="text-sm font-medium text-foreground">{t("board.noIssues")}</div>
                <div className="max-w-[180px] text-xs">{t("board.dropIssueHere")}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id}>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
