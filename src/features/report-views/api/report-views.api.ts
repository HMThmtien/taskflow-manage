import { authFetchJson } from "@/services/api/client";

export type ReportRouteKey = "dashboard" | "reports";

export type ReportView = {
  id: string;
  routeKey: ReportRouteKey;
  name: string;
  projectId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportViewPayload = {
  routeKey: ReportRouteKey;
  name: string;
  projectId: string;
  isDefault?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export async function getReportViews(routeKey: ReportRouteKey) {
  const response = await authFetchJson<ApiEnvelope<ReportView[]> | ReportView[]>(`/api/report-views?routeKey=${routeKey}`);
  const payload = Array.isArray(response) ? response : response?.data;
  return Array.isArray(payload) ? payload : [];
}

export async function createReportView(payload: CreateReportViewPayload) {
  const response = await authFetchJson<ApiEnvelope<ReportView> | ReportView>("/api/report-views", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return "data" in (response as ApiEnvelope<ReportView>) ? (response as ApiEnvelope<ReportView>).data : (response as ReportView);
}

export function deleteReportView(reportViewId: string) {
  return authFetchJson<void>(`/api/report-views/${reportViewId}`, {
    method: "DELETE",
  });
}
