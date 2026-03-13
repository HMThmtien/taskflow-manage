import { authFetchJson } from "@/services/api/client";
import type { Issue } from "@/features/issues/api/issues.api";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

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
  position: number;
  issueCount: number;
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

export function completeSprint(projectId: string, sprintId: string) {
  return authFetchJson<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}/complete`, {
    method: "PATCH",
  });
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
