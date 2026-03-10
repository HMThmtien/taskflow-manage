import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useIssueFilters } from "@/features/issues/api/use-issue-filters";
import type { IssueFilters } from "@/features/issues/api/issue-filters";

type Member = { userId: string; username: string };

const statusOptions: { value: NonNullable<IssueFilters["status"]>; label: string }[] = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const priorityOptions: { value: NonNullable<IssueFilters["priority"]>; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
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
  const { filters, setFilter } = useIssueFilters();

  // Search local
  const [qLocal, setQLocal] = useState(filters.q ?? "");
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current) setQLocal(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const t = setTimeout(() => {
      isTypingRef.current = false;
      const nextQ = qLocal.trim();
      if ((filters.q ?? "") !== nextQ) setFilter({ ...filters, q: nextQ || undefined });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

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
        label: `Status: ${filters.status === "IN_PROGRESS" ? "In Progress" : filters.status === "TODO" ? "Todo" : "Done"}`,
        onRemove: () => setFilter({ ...filters, status: undefined }),
      });
    }

    if (filters.priority) {
      out.push({
        key: "priority",
        label: `Priority: ${filters.priority}`,
        onRemove: () => setFilter({ ...filters, priority: undefined }),
      });
    }

    if (filters.label) {
      out.push({
        key: "label",
        label: `Label: ${filters.label}`,
        onRemove: () => setFilter({ ...filters, label: undefined }),
      });
    }

    if (filters.assigneeId) {
      const name = (members ?? []).find((m) => m.userId === filters.assigneeId)?.username ?? filters.assigneeId;
      out.push({
        key: "assigneeId",
        label: `Assignee: ${name}`,
        onRemove: () => setFilter({ ...filters, assigneeId: undefined }),
      });
    }

    if (filters.dueFrom || filters.dueTo) {
      const a = filters.dueFrom ?? "…";
      const b = filters.dueTo ?? "…";
      out.push({
        key: "due",
        label: `Due: ${a} → ${b}`,
        onRemove: () => setFilter({ ...filters, dueFrom: undefined, dueTo: undefined }),
      });
    }

    return out;
  }, [filters, members, setFilter]);

  return (
    <div className="flex flex-col gap-3 mb-3">
      {/* Compact row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Input
            id="issue-search"
            className="w-full md:w-[360px]"
            placeholder="Search issues..."
            value={qLocal}
            onChange={(e) => {
              isTypingRef.current = true;
              setQLocal(e.target.value);
            }}
          />

          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => setFilter({ ...filters, status: v === "all" ? undefined : asStatus(v) })}
          >
            <SelectTrigger className="w-[160px] hidden sm:flex">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? "all"}
            onValueChange={(v) => setFilter({ ...filters, priority: v === "all" ? undefined : asPriority(v) })}
          >
            <SelectTrigger className="w-[160px] hidden sm:flex">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorityOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {chips.length ? (
                  <Badge variant="secondary" className="ml-1 px-2 py-0.5">
                    {chips.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px]">
              <div className="space-y-4">
                <div className="text-sm font-medium">Advanced filters</div>

                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Label</div>
                    <Input
                      placeholder="e.g. bug"
                      value={filters.label ?? ""}
                      onChange={(e) => setFilter({ ...filters, label: e.target.value.trim() || undefined })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Assignee</div>
                    <Select
                      value={filters.assigneeId ?? "all"}
                      onValueChange={(v) => setFilter({ ...filters, assigneeId: v === "all" ? undefined : v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any assignee</SelectItem>
                        {(members ?? []).map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Due date range</div>
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

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
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
                    Clear all
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    Tip: Share URL to share filters.
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Clear filters"
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

      {/* Active chips */}
      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent/40 transition inline-flex items-center gap-2"
              title="Click to remove"
            >
              <span className="text-muted-foreground">×</span>
              <span className="font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}