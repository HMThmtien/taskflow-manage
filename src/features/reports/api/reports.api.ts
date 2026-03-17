import { authFetchJson } from "@/services/api/client";
import type {
  ProjectSummaryReport,
  ProjectWorkloadReport,
  SprintProgressReport,
  WorkspaceReport,
} from "../types/reports.types";

type ApiResponse<T> = {
  data?: T;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getWorkspaceReport(params?: {
  from?: string;
  to?: string;
  projectId?: string;
}) {
  const search = new URLSearchParams();

  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.projectId) search.set("projectId", params.projectId);

  const qs = search.toString();

  const res = await authFetchJson<ApiResponse<WorkspaceReport> | WorkspaceReport>(
    `/api/reports/workspace${qs ? `?${qs}` : ""}`
  );

  return unwrap(res);
}

export async function getProjectSummaryReport(projectId: string) {
  const res = await authFetchJson<ApiResponse<ProjectSummaryReport> | ProjectSummaryReport>(
    `/api/projects/${projectId}/reports/summary`
  );

  return unwrap(res);
}

export async function getProjectWorkloadReport(projectId: string) {
  const res = await authFetchJson<ApiResponse<ProjectWorkloadReport> | ProjectWorkloadReport>(
    `/api/projects/${projectId}/reports/workload`
  );

  return unwrap(res);
}

export async function getProjectSprintProgressReport(projectId: string) {
  const res = await authFetchJson<ApiResponse<SprintProgressReport> | SprintProgressReport>(
    `/api/projects/${projectId}/reports/sprint-progress`
  );

  return unwrap(res);
}
