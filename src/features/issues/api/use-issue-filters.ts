import { useSearchParams } from "react-router-dom";
import { type IssueFilters } from "./issue-filters";

export function useIssueFilters() {
  const [params, setParams] = useSearchParams();

  const filters: IssueFilters = {
    q: params.get("q") || undefined,
    status: (params.get("status") as IssueFilters["status"]) || undefined,
    priority: (params.get("priority") as IssueFilters["priority"]) || undefined,
  };

  const setFilter = (next: IssueFilters) => {
    const p = new URLSearchParams();

    if (next.q) p.set("q", next.q);
    if (next.status) p.set("status", next.status);
    if (next.priority) p.set("priority", next.priority);

    setParams(p, { replace: true });
  };

  return { filters, setFilter };
}
