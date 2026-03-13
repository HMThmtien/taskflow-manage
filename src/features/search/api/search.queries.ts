import { useQuery } from "@tanstack/react-query";
import { searchWorkspace } from "./search.api";

export const searchKeys = {
  all: ["search"] as const,
  global: (q: string, limit: number) => [...searchKeys.all, "global", q, limit] as const,
};

export function useGlobalSearchQuery(q: string, limit = 5, enabled = true) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: searchKeys.global(trimmed, limit),
    queryFn: () => searchWorkspace(trimmed, limit),
    enabled: enabled && trimmed.length > 0,
    staleTime: 15_000,
  });
}
