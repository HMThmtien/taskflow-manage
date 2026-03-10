import { authFetchJson } from "@/services/api/client";
import type { ActivityResponse } from "../types/activity.types";

type ApiResponse<T> = {
  data?: T;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

export async function getActivity(params?: {
  q?: string;
  projectId?: string;
  actor?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();

  if (params?.q) search.set("q", params.q);
  if (params?.projectId) search.set("projectId", String(params.projectId));
  if (params?.actor) search.set("actor", params.actor);
  if (params?.type) search.set("type", params.type);
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));

  const res = await authFetchJson<ApiResponse<ActivityResponse> | ActivityResponse>(
    `/api/activity?${search.toString()}`
  );

  return unwrap(res);
}