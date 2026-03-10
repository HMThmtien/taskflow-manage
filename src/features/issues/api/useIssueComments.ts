import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetchJson } from "@/services/api/client";

type ApiResponse<T> = { data: T };

type PageResponse<T> = {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type IssueComment = {
  id: string;
  issueId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
};

export function useIssueComments(issueId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["issue", issueId, "comments"],
    queryFn: async () => {
      const res = await authFetchJson<ApiResponse<PageResponse<IssueComment>>>(
        `/api/issues/${issueId}/comments`
      );
      return res.data.content ?? [];
    },
    enabled: enabled && !!issueId,
  });
}

export function useCreateComment(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await authFetchJson<ApiResponse<IssueComment>>(
        `/api/issues/${issueId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue", issueId, "comments"] });
      qc.invalidateQueries({ queryKey: ["issue", issueId, "activities"] });
    },
  });
}