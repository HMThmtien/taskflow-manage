import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIssue, getIssues, moveIssue, type Issue, type IssueStatus } from "./issues.api";

export const issuesKeys = {
  byProject: (projectId: string) => ["issues", projectId] as const,
};

export function useIssuesQuery(projectId: string) {
  return useQuery({
    queryKey: issuesKeys.byProject(projectId),
    queryFn: () => getIssues(projectId),
  });
}

export function useMoveIssueMutation(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (p: { issueId: string; status: IssueStatus }) => moveIssue(p),

    // Optimistic update
    onMutate: async ({ issueId, status }) => {
      await qc.cancelQueries({ queryKey: issuesKeys.byProject(projectId) });
      const prev = qc.getQueryData<Issue[]>(issuesKeys.byProject(projectId));

      qc.setQueryData<Issue[]>(issuesKeys.byProject(projectId), (old) =>
        (old ?? []).map((it) =>
          it.id === issueId ? { ...it, status, updatedAt: new Date().toISOString() } : it
        )
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(issuesKeys.byProject(projectId), ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.byProject(projectId) });
    },
  });
}

import { updateIssue } from "./issues.api";

export function useUpdateIssueMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { issueId: string; title?: string; description?: string; status?: IssueStatus }) =>
      updateIssue(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.byProject(projectId) });
    },
  });
}


export function useCreateIssueMutation(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { title: string; description?: string; priority?: "low" | "medium" | "high" }) =>
      createIssue({ projectId, ...payload }),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: issuesKeys.byProject(projectId) });
      const prev = qc.getQueryData<Issue[]>(issuesKeys.byProject(projectId));

      // optimistic insert
      const temp: Issue = {
        id: `temp_${Math.random().toString(16).slice(2)}`,
        projectId,
        title: payload.title,
        description: payload.description,
        status: "todo",
        priority: payload.priority ?? "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData<Issue[]>(issuesKeys.byProject(projectId), (old) => [temp, ...(old ?? [])]);

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(issuesKeys.byProject(projectId), ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: issuesKeys.byProject(projectId) });
    },
  });
}


