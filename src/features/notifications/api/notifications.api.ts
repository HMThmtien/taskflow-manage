import { authFetchJson } from "@/services/api/client";
import type { NotificationsResponse } from "../types/notifications.types";

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === "object" && "data" in res) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}

function normalizeNotificationsResponse(response: NotificationsResponse): NotificationsResponse {
  return {
    ...response,
    items: (response.items ?? []).map((item) => {
      const normalized = item as typeof item & { read?: boolean };
      return {
        ...item,
        isRead: typeof normalized.isRead === "boolean" ? normalized.isRead : !!normalized.read,
      };
    }),
  };
}

export async function getNotifications(params?: {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();

  if (params?.unreadOnly !== undefined) {
    search.set("unreadOnly", String(params.unreadOnly));
  }

  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));

  const res = await authFetchJson<
    ApiResponse<NotificationsResponse> | NotificationsResponse
  >(`/api/notifications?${search.toString()}`);

  return normalizeNotificationsResponse(unwrap(res));
}

export async function markNotificationAsRead(id: string) {
  const res = await authFetchJson<
    ApiResponse<{ message: string }> | { message: string }
  >(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });

  return unwrap(res);
}

export async function markAllNotificationsAsRead() {
  const res = await authFetchJson<
    ApiResponse<{ message: string }> | { message: string }
  >("/api/notifications/read-all", {
    method: "PATCH",
  });

  return unwrap(res);
}
