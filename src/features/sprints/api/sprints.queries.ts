import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { issueKeys } from "@/features/issues/api/issues.queries";
import {
  assignIssueToSprint,
  completeSprint,
  createSprint,
  getBacklogIssues,
  getSprints,
  startSprint,
  updateSprint,
  type SprintPayload,
} from "./sprints.api";

export const sprintKeys = {
  all: ["sprints"] as const,
  project: (projectId: string) => [...sprintKeys.all, projectId] as const,
  backlog: (projectId: string) => [...sprintKeys.project(projectId), "backlog"] as const,
};

export function useSprintsQuery(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.project(projectId),
    queryFn: () => getSprints(projectId),
    enabled: !!projectId,
  });
}

export function useBacklogIssuesQuery(projectId: string) {
  return useQuery({
    queryKey: sprintKeys.backlog(projectId),
    queryFn: () => getBacklogIssues(projectId),
    enabled: !!projectId,
  });
}

function invalidatePlanning(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: sprintKeys.project(projectId) });
  qc.invalidateQueries({ queryKey: sprintKeys.backlog(projectId) });
  qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
}

export function useCreateSprintMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SprintPayload) => createSprint(projectId, payload),
    onSuccess: () => invalidatePlanning(qc, projectId),
  });
}

export function useUpdateSprintMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: SprintPayload }) =>
      updateSprint(projectId, sprintId, payload),
    onSuccess: () => invalidatePlanning(qc, projectId),
  });
}

export function useStartSprintMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => startSprint(projectId, sprintId),
    onSuccess: () => invalidatePlanning(qc, projectId),
  });
}

export function useCompleteSprintMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => completeSprint(projectId, sprintId),
    onSuccess: () => invalidatePlanning(qc, projectId),
  });
}

export function useAssignIssueToSprintMutation(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, sprintId }: { issueId: string; sprintId?: string | null }) =>
      assignIssueToSprint(projectId, issueId, sprintId),
    onSuccess: () => invalidatePlanning(qc, projectId),
  });
}
