import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIssue,
  getIssues,
  moveIssue,
  updateIssue,
  type IssueListParams,
  type IssueStatus,
  type CreateIssuePayload,
  type UpdateIssuePayload,
} from "./issues.api";

export const issueKeys = {
  all: ["issues"] as const,
  project: (projectId: string) => [...issueKeys.all, projectId] as const,
  list: (projectId: string, params: IssueListParams) =>
    [...issueKeys.project(projectId), "list", params] as const,
};

export function useIssuesQuery(projectId: string, params: IssueListParams, enabled = true) {
  return useQuery({
    queryKey: issueKeys.list(projectId, params),
    queryFn: () => getIssues(projectId, params),
    enabled: !!projectId && enabled,
  });
}

export function useCreateIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIssuePayload) => createIssue(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}

export function useUpdateIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, payload }: { issueId: string; payload: UpdateIssuePayload }) =>
      updateIssue(projectId, issueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}

export function useMoveIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: IssueStatus }) =>
      moveIssue(projectId, issueId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
    },
  });
}
