import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIssue,
  getIssues,
  moveIssue,
  updateIssue,
  type IssueListParams,
  type Issue,
  type IssueStatus,
  type IssuePriority,
} from "./issues.api";

export const issueKeys = {
  all: ["issues"] as const,
  project: (projectId: string) => [...issueKeys.all, projectId] as const,
  list: (projectId: string, params: IssueListParams) => [...issueKeys.project(projectId), "list", params] as const,
};

// ✅ Query vẫn nhận params để server filter
export function useIssuesQuery(projectId: string, params: IssueListParams) {
  return useQuery({
    queryKey: issueKeys.list(projectId, params),
    queryFn: () => getIssues(projectId, params),
    enabled: !!projectId,
  });
}

// ✅ Mutation KHÔNG cần params nữa
export function useCreateIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; priority: IssuePriority }) =>
      createIssue(projectId, payload),
    onSuccess: () => {
      // invalidate mọi list issues của project này (mọi filter)
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}

export function useUpdateIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      payload,
    }: {
      issueId: string;
      payload: Partial<Pick<Issue, "title" | "description" | "status" | "priority">>;
    }) => updateIssue(projectId, issueId, payload), // ✅ sửa ở đây

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}

export function useMoveIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      moveIssue(projectId, issueId, { status }), // ✅ sửa ở đây

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}