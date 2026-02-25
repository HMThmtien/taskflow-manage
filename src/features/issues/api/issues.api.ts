import { authFetchJson } from "@/services/api/client";

export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH";

export type Issue = {
  id: string;
  projectId: string; // nếu BE IssueResponse không trả field này thì bạn có thể bỏ
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
};

export type IssueListParams = {
  q?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
};

export function getIssues(projectId: string, params: IssueListParams = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);

  const qs = sp.toString();
  return authFetchJson<Issue[]>(
    `/api/projects/${projectId}/issues${qs ? `?${qs}` : ""}`
  );
}

export function createIssue(
  projectId: string,
  payload: { title: string; description?: string; priority: IssuePriority; status?: IssueStatus }
) {
  return authFetchJson<Issue>(`/api/projects/${projectId}/issues`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIssue(
  projectId: string,
  issueId: string,
  payload: { title?: string; description?: string; status?: IssueStatus; priority?: IssuePriority }
) {
  return authFetchJson<Issue>(`/api/projects/${projectId}/issues/${issueId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function moveIssue(projectId: string, issueId: string, payload: { status: IssueStatus }) {
  return authFetchJson<Issue>(`/api/projects/${projectId}/issues/${issueId}/move`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}