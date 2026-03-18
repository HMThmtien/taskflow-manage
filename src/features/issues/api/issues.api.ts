import { authFetchJson } from "@/services/api/client";

export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH";

export type IssueType = "TASK" | "BUG" | "STORY" | "EPIC" | "SUBTASK";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  parentIssueId?: string | null;
  parentIssueTitle?: string | null;
  position: number;
  reporterId?: string | null;
  reporterUsername?: string | null;
  assigneeId?: string | null;
  assigneeUsername?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  sprintStatus?: SprintStatus | null;
  dueDate?: string | null;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
};

export type IssueListParams = {
  q?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  sprintId?: string;
  dueFrom?: string;
  dueTo?: string;
  label?: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getIssues(projectId: string, params: IssueListParams = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.assigneeId) sp.set("assigneeId", params.assigneeId);
  if (params.sprintId) sp.set("sprintId", params.sprintId);
  if (params.dueFrom) sp.set("dueFrom", params.dueFrom);
  if (params.dueTo) sp.set("dueTo", params.dueTo);
  if (params.label) sp.set("label", params.label);

  const qs = sp.toString();

  const res = await authFetchJson<PageResponse<Issue>>(
    `/api/projects/${projectId}/issues${qs ? `?${qs}` : ""}`
  );

  return res.content ?? [];
}

export type CreateIssuePayload = {
  title: string;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  type?: IssueType;
  parentIssueId?: string;
  assigneeId?: string;
  dueDate?: string;
  labels?: string[];
};

export function createIssue(projectId: string, payload: CreateIssuePayload) {
  return authFetchJson<Issue>(`/api/projects/${projectId}/issues`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type UpdateIssuePayload = Partial<CreateIssuePayload>;

export function updateIssue(projectId: string, issueId: string, payload: UpdateIssuePayload) {
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

export type BulkUpdateIssuesPayload = {
  issueIds: string[];
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  clearAssignee?: boolean;
  sprintId?: string;
  clearSprint?: boolean;
  dueDate?: string;
  labels?: string[];
};

export function bulkUpdateIssues(projectId: string, payload: BulkUpdateIssuesPayload) {
  return authFetchJson<Issue[]>(`/api/projects/${projectId}/issues/bulk`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
