import { authFetchJson } from "@/services/api/client";

export type Project = {
  id: string;
  key: string;
  name: string;
  description?: string;
  archived: boolean;
  archivedAt?: string | null;
  createdAt: string;
};

export type CreateProjectPayload = {
  key: string;
  name: string;
  description?: string;
};

export type UpdateProjectPayload = {
  key: string;
  name: string;
  description?: string;
};

export function getProjects() {
  return authFetchJson<Project[]>("/api/projects");
}

export function getProject(id: string) {
  return authFetchJson<Project>(`/api/projects/${id}`);
}

export function createProject(payload: CreateProjectPayload) {
  return authFetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(id: string, payload: UpdateProjectPayload) {
  return authFetchJson<Project>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function archiveProject(id: string) {
  return authFetchJson<Project>(`/api/projects/${id}/archive`, {
    method: "PATCH",
  });
}

export function unarchiveProject(id: string) {
  return authFetchJson<Project>(`/api/projects/${id}/unarchive`, {
    method: "PATCH",
  });
}

export function deleteProject(id: string) {
  return authFetchJson<void>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}
