import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { type IssueFilters } from "./issue-filters";

function normalize(v?: string | null) {
  const s = (v ?? "").trim();
  return s ? s : undefined;
}

export function useIssueFilters() {
  const [params, setParams] = useSearchParams();

  const filters: IssueFilters = useMemo(
    () => ({
      q: normalize(params.get("q")),
      status: (normalize(params.get("status")) as IssueFilters["status"]) || undefined,
      priority: (normalize(params.get("priority")) as IssueFilters["priority"]) || undefined,

      assigneeId: normalize(params.get("assigneeId")),
      label: normalize(params.get("label")),
      dueFrom: normalize(params.get("dueFrom")),
      dueTo: normalize(params.get("dueTo")),
    }),
    [params]
  );

  const setFilter = useCallback(
    (next: IssueFilters) => {
      const p = new URLSearchParams(params);

      const setOrDelete = (key: string, value?: string) => {
        const v = normalize(value);
        if (v) p.set(key, v);
        else p.delete(key);
      };

      setOrDelete("q", next.q);
      setOrDelete("status", next.status);
      setOrDelete("priority", next.priority);

      setOrDelete("assigneeId", next.assigneeId);
      setOrDelete("label", next.label);
      setOrDelete("dueFrom", next.dueFrom);
      setOrDelete("dueTo", next.dueTo);

      const prev = params.toString();
      const nextStr = p.toString();
      if (prev === nextStr) return;

      setParams(p, { replace: true });
    },
    [params, setParams]
  );

  return { filters, setFilter };
}