import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReportView,
  deleteReportView,
  getReportViews,
  type CreateReportViewPayload,
  type ReportRouteKey,
} from "./report-views.api";

export const reportViewKeys = {
  all: ["report-views"] as const,
  list: (routeKey: ReportRouteKey) => [...reportViewKeys.all, routeKey] as const,
};

export function useReportViewsQuery(routeKey: ReportRouteKey) {
  return useQuery({
    queryKey: reportViewKeys.list(routeKey),
    queryFn: () => getReportViews(routeKey),
  });
}

export function useCreateReportViewMutation(routeKey: ReportRouteKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportViewPayload) => createReportView(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportViewKeys.list(routeKey) });
    },
  });
}

export function useDeleteReportViewMutation(routeKey: ReportRouteKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportViewId: string) => deleteReportView(reportViewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportViewKeys.list(routeKey) });
    },
  });
}
