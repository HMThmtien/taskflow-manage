import { fetchJson } from "@/services/api/client";

export type IssueStatus = "todo" | "in_progress" | "done";

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
};

export function getIssues(projectId: string) {
  return fetchJson<Issue[]>(`/api/projects/${projectId}/issues`);
}

export function moveIssue(payload: { issueId: string; status: IssueStatus }) {
  return fetchJson<Issue>(`/api/issues/${payload.issueId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: payload.status }),
  });
}

export function updateIssue(payload: {
    issueId: string;
    title?: string;
    description?: string;
    status?: IssueStatus;
  }) {
    return fetchJson<Issue>(`/api/issues/${payload.issueId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        status: payload.status,
      }),
    });
  }
  
  export function createIssue(payload: {
    projectId: string;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
  }) {
    return fetchJson<Issue>("/api/issues", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  