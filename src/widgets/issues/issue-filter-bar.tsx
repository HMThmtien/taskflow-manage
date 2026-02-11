import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useIssueFilters } from "@/features/issues/api/use-issue-filters";
import type { IssueFilters } from "@/features/issues/api/issue-filters";

const statusOptions: { value: NonNullable<IssueFilters["status"]>; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: NonNullable<IssueFilters["priority"]>; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function IssueFilterBar() {
  const { filters, setFilter } = useIssueFilters();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left: Search */}
      <div className="flex items-center gap-2">
        <Input
          id="issue-search"
          className="w-full md:w-[320px]"
          placeholder="Search issues..."
          value={filters.q ?? ""}
          onChange={(e) => setFilter({ ...filters, q: e.target.value || undefined })}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Clear filters"
          onClick={() => setFilter({})}
          disabled={!filters.q && !filters.status && !filters.priority}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Selects */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilter({ ...filters, status: v === "all" ? undefined : (v as any) })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
          onValueChange={(v) => setFilter({ ...filters, priority: v === "all" ? undefined : (v as any) })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
    </div>
  );
}
