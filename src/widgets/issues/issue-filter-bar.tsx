import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/features/i18n/i18n";
import { useIssueFilters } from "@/features/issues/api/use-issue-filters";
import type { IssueFilters } from "@/features/issues/api/issue-filters";

type Member = { userId: string; username: string };

const statusOptions: { value: NonNullable<IssueFilters["status"]>; key: string }[] = [
  { value: "TODO", key: "status.TODO" },
  { value: "IN_PROGRESS", key: "status.IN_PROGRESS" },
  { value: "DONE", key: "status.DONE" },
];

const priorityOptions: { value: NonNullable<IssueFilters["priority"]>; key: string }[] = [
  { value: "LOW", key: "priority.LOW" },
  { value: "MEDIUM", key: "priority.MEDIUM" },
  { value: "HIGH", key: "priority.HIGH" },
];

function asStatus(v: string): IssueFilters["status"] | undefined {
  if (v === "TODO" || v === "IN_PROGRESS" || v === "DONE") return v;
  return undefined;
}

function asPriority(v: string): IssueFilters["priority"] | undefined {
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH") return v;
  return undefined;
}

export function IssueFilterBar({ members }: { members?: Member[] }) {
  const { t } = useI18n();
  const { filters, setFilter } = useIssueFilters();
  const [qLocal, setQLocal] = useState(filters.q ?? "");
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current) setQLocal(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      isTypingRef.current = false;
      const nextQ = qLocal.trim();
      if ((filters.q ?? "") !== nextQ) setFilter({ ...filters, q: nextQ || undefined });
    }, 350);
    return () => clearTimeout(timeout);
  }, [filters, qLocal, setFilter]);

  const hasAnyFilter =
    !!filters.q ||
    !!filters.status ||
    !!filters.priority ||
    !!filters.assigneeId ||
    !!filters.label ||
    !!filters.dueFrom ||
    !!filters.dueTo;

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.status) {
      out.push({
        key: "status",
        label: t("board.statusChip", { value: t(`status.${filters.status}`) }),
        onRemove: () => setFilter({ ...filters, status: undefined }),
      });
    }

    if (filters.priority) {
      out.push({
        key: "priority",
        label: t("board.priorityChip", { value: t(`priority.${filters.priority}`) }),
        onRemove: () => setFilter({ ...filters, priority: undefined }),
      });
    }

    if (filters.label) {
      out.push({
        key: "label",
        label: t("board.labelChip", { value: filters.label }),
        onRemove: () => setFilter({ ...filters, label: undefined }),
      });
    }

    if (filters.assigneeId) {
      const name = (members ?? []).find((member) => member.userId === filters.assigneeId)?.username ?? filters.assigneeId;
      out.push({
        key: "assigneeId",
        label: t("board.assigneeChip", { value: name }),
        onRemove: () => setFilter({ ...filters, assigneeId: undefined }),
      });
    }

    if (filters.dueFrom || filters.dueTo) {
      out.push({
        key: "due",
        label: t("board.due", {
          from: filters.dueFrom ?? "...",
          to: filters.dueTo ?? "...",
        }),
        onRemove: () => setFilter({ ...filters, dueFrom: undefined, dueTo: undefined }),
      });
    }

    return out;
  }, [filters, members, setFilter, t]);

  return (
    <div className="mb-3 flex flex-col gap-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Input
            id="issue-search"
            className="w-full md:w-[360px]"
            placeholder={t("board.searchIssues")}
            value={qLocal}
            onChange={(e) => {
              isTypingRef.current = true;
              setQLocal(e.target.value);
            }}
          />

          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) => setFilter({ ...filters, status: value === "all" ? undefined : asStatus(value) })}
          >
            <SelectTrigger className="hidden w-[160px] sm:flex">
              <SelectValue placeholder={t("issue.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("board.allStatuses")}</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? "all"}
            onValueChange={(value) => setFilter({ ...filters, priority: value === "all" ? undefined : asPriority(value) })}
          >
            <SelectTrigger className="hidden w-[160px] sm:flex">
              <SelectValue placeholder={t("issue.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("board.allPriorities")}</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {t("board.filters")}
                {chips.length ? (
                  <Badge variant="secondary" className="ml-1 px-2 py-0.5">
                    {chips.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px]">
              <div className="space-y-4">
                <div className="text-sm font-medium">{t("board.advancedFilters")}</div>

                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">{t("board.label")}</div>
                    <Input
                      placeholder="e.g. bug"
                      value={filters.label ?? ""}
                      onChange={(e) => setFilter({ ...filters, label: e.target.value.trim() || undefined })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">{t("board.assignee")}</div>
                    <Select
                      value={filters.assigneeId ?? "all"}
                      onValueChange={(value) =>
                        setFilter({ ...filters, assigneeId: value === "all" ? undefined : value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("issue.assignee")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("board.anyAssignee")}</SelectItem>
                        {(members ?? []).map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">{t("board.dueDateRange")}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={filters.dueFrom ?? ""}
                        onChange={(e) => setFilter({ ...filters, dueFrom: e.target.value || undefined })}
                      />
                      <Input
                        type="date"
                        value={filters.dueTo ?? ""}
                        onChange={(e) => setFilter({ ...filters, dueTo: e.target.value || undefined })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilter({});
                      setQLocal("");
                      isTypingRef.current = false;
                    }}
                    disabled={!hasAnyFilter}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t("board.clearAll")}
                  </Button>

                  <div className="text-xs text-muted-foreground">{t("board.shareFiltersTip")}</div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="icon"
            title={t("board.clearFilters")}
            onClick={() => {
              setFilter({});
              setQLocal("");
              isTypingRef.current = false;
            }}
            disabled={!hasAnyFilter}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs transition hover:bg-accent/40"
              title={t("board.clickToRemove")}
            >
              <span className="text-muted-foreground">x</span>
              <span className="font-medium">{chip.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
