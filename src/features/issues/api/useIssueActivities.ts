import { useQuery } from "@tanstack/react-query";
import { authFetchJson } from "@/services/api/client";

type ApiResponse<T> = { data: T };

export type IssueActivity = {
  id: string;
  issueId: string;
  actorId: string;
  actorUsername: string;
  type: string;
  payload: Record<string, any>;
  createdAt: string;
};

export function useIssueActivities(issueId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["issue", issueId, "activities"],
    queryFn: async () => {
      const res = await authFetchJson<ApiResponse<IssueActivity[]>>(
        `/api/issues/${issueId}/activities`
      );
      return res.data; // ✅ return array
    },
    enabled: enabled && !!issueId,
  });
}