import { authFetchJson } from "@/services/api/client";

export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type ProjectMember = {
  userId: string;
  username: string;
  role: ProjectRole;
};

export type MyProjectRole = {
  projectId: string;
  userId: string;
  role: ProjectRole;
};

export function getProjectMembers(projectId: string) {
  return authFetchJson<ProjectMember[]>(`/api/projects/${projectId}/members`);
}

export function getMyProjectRole(projectId: string) {
  return authFetchJson<MyProjectRole>(`/api/projects/${projectId}/members/me`);
}

export function addProjectMember(projectId: string, payload: { username: string; role: ProjectRole }) {
  return authFetchJson<ProjectMember>(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProjectMemberRole(projectId: string, userId: string, payload: { role: ProjectRole }) {
  return authFetchJson<ProjectMember>(`/api/projects/${projectId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removeProjectMember(projectId: string, userId: string) {
  return authFetchJson<void>(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}