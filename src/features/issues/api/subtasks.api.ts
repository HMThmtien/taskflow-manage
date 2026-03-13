import { authFetchJson } from "@/services/api/client";
import type { CreateIssuePayload, Issue } from "./issues.api";

type ApiResponse<T> = {
  data?: T;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getSubtasks(projectId: string, issueId: string) {
  const res = await authFetchJson<ApiResponse<Issue[]> | Issue[]>(
    `/api/projects/${projectId}/issues/${issueId}/subtasks`
  );
  return unwrap(res) ?? [];
}

export async function createSubtask(
  projectId: string,
  issueId: string,
  payload: CreateIssuePayload
) {
  const res = await authFetchJson<ApiResponse<Issue> | Issue>(
    `/api/projects/${projectId}/issues/${issueId}/subtasks`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return unwrap(res);
}