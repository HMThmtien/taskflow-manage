import { authFetchJson } from "@/services/api/client";
import type { Issue } from "@/features/issues/api/issues.api";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";
export type SprintCompletionAction = "MOVE_TO_BACKLOG" | "MOVE_TO_SPRINT";

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  description?: string | null;
  status: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  completionAction?: SprintCompletionAction | null;
  completedTargetSprintId?: string | null;
  position: number;
  issueCount: number;
  completedTotalIssues?: number | null;
  completedDoneIssues?: number | null;
  completedInProgressIssues?: number | null;
  completedTodoIssues?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SprintPayload = {
  name: string;
  goal?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

export type CompleteSprintPayload = {
  completionAction: SprintCompletionAction;
  targetSprintId?: string | null;
};

export type SprintMetrics = {
  sprintId: string;
  totalIssues: number;
  doneIssues: number;
  inProgressIssues: number;
  todoIssues: number;
  unfinishedIssues: number;
  completionPercent: number;
  completionAction?: SprintCompletionAction | null;
  targetSprintId?: string | null;
};

export function getSprints(projectId: string) {
  return authFetchJson<Sprint[]>(`/api/projects/${projectId}/sprints`);
}

export function createSprint(projectId: string, payload: SprintPayload) {
  return authFetchJson<Sprint>(`/api/projects/${projectId}/sprints`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSprint(projectId: string, sprintId: string, payload: SprintPayload) {
  return authFetchJson<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function startSprint(projectId: string, sprintId: string) {
  return authFetchJson<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}/start`, {
    method: "PATCH",
  });
}

export function completeSprint(projectId: string, sprintId: string, payload: CompleteSprintPayload) {
  return authFetchJson<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSprintMetrics(projectId: string, sprintId: string) {
  return authFetchJson<SprintMetrics>(`/api/projects/${projectId}/sprints/${sprintId}/metrics`);
}

export function getBacklogIssues(projectId: string) {
  return authFetchJson<Issue[]>(`/api/projects/${projectId}/backlog/issues`);
}

export function assignIssueToSprint(projectId: string, issueId: string, sprintId?: string | null) {
  return authFetchJson<Issue>(`/api/projects/${projectId}/issues/${issueId}/sprint`, {
    method: "PATCH",
    body: JSON.stringify({ sprintId: sprintId ?? null }),
  });
}
