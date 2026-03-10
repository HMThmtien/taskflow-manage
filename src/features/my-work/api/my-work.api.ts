import { authFetchJson } from "@/services/api/client";
import type { GetMyWorkParams, MyWorkIssue } from "../types/my-work.types";

type ApiResponse<T> = {
  data?: T;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getMyWork(params: GetMyWorkParams) {
  const search = new URLSearchParams();

  search.set("type", params.type);
  if (params.q) search.set("q", params.q);
  if (params.projectId) search.set("projectId", String(params.projectId));
  if (params.status) search.set("status", params.status);
  if (params.priority) search.set("priority", params.priority);

  const res = await authFetchJson<ApiResponse<MyWorkIssue[]> | MyWorkIssue[]>(
    `/api/issues/me?${search.toString()}`
  );

  return unwrap(res) ?? [];
}