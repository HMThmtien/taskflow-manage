import { fetchJson } from "@/services/api/client";

export type Project = {
  id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: string;
};

export function getProjects() {
  return fetchJson<Project[]>("/api/projects");
}

export function createProject(payload: { name: string; key: string; description?: string }) {
  return fetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getProject(projectId: string) {
  return fetchJson<Project>(`/api/projects/${projectId}`);
}
