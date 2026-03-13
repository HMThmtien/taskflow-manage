import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { openAuthEventStream } from "@/services/api/client";
import { useAuthStore } from "@/stores/auth.store";
import type { IssueComment } from "@/features/issues/api/useIssueComments";
import type { IssueActivity } from "@/features/issues/api/useIssueActivities";
import type { NotificationItem, NotificationsResponse } from "@/features/notifications/types/notifications.types";
import { notificationsKeys } from "@/features/notifications/api/notifications.queries";

type RealtimeEnvelope = {
  id: string;
  type: string;
  issuedAt: string;
  payload: any;
};

function upsertById<T extends { id: string }>(items: T[], nextItem: T, mode: "prepend" | "append") {
  const existing = items.findIndex((item) => item.id === nextItem.id);
  if (existing >= 0) {
    const next = [...items];
    next[existing] = nextItem;
    return next;
  }
  return mode === "prepend" ? [nextItem, ...items] : [...items, nextItem];
}

export function useRealtimeEvents() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const retryRef = useRef<number | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    const close = openAuthEventStream("/api/realtime/stream", {
      onOpen: () => {
        queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "issue" &&
            (query.queryKey[2] === "comments" || query.queryKey[2] === "activities"),
        });
      },
      onEvent: (_, raw) => {
        const envelope = raw as RealtimeEnvelope;
        if (!envelope?.type) return;

        if (envelope.type === "realtime.connected" || envelope.type === "realtime.heartbeat") {
          return;
        }

        if (envelope.type === "issue.comment.created") {
          const issueId = envelope.payload?.issueId as string | undefined;
          const comment = envelope.payload?.comment as IssueComment | undefined;
          if (!issueId || !comment) return;

          queryClient.setQueryData<IssueComment[]>(["issue", issueId, "comments"], (current) =>
            upsertById(current ?? [], comment, "prepend")
          );
          return;
        }

        if (envelope.type === "issue.activity.created") {
          const issueId = envelope.payload?.issueId as string | undefined;
          const activity = envelope.payload?.activity as IssueActivity | undefined;
          if (!issueId || !activity) return;

          queryClient.setQueryData<IssueActivity[]>(["issue", issueId, "activities"], (current) =>
            upsertById(current ?? [], activity, "append")
          );
          return;
        }

        if (envelope.type === "notification.created") {
          const notification = envelope.payload?.notification as NotificationItem | undefined;
          if (!notification) return;

          queryClient.setQueriesData<NotificationsResponse>(
            { queryKey: notificationsKeys.all },
            (current) => {
              if (!current) return current;

              const isUnreadOnly = current.items.every((item) => !item.isRead) && current.items.length > 0;
              const nextItems = notification.isRead && isUnreadOnly
                ? current.items
                : upsertById(current.items, notification, "prepend").slice(0, current.pageSize);

              return {
                ...current,
                items: nextItems,
                total: current.total + (current.items.some((item) => item.id === notification.id) ? 0 : 1),
                unreadCount: current.unreadCount + (notification.isRead ? 0 : 1),
              };
            }
          );
        }
      },
      onError: () => {
        if (!active) return;
        retryRef.current = window.setTimeout(() => {
          setRetryTick((current) => current + 1);
        }, 1500);
      },
    });

    return () => {
      active = false;
      close();
      if (retryRef.current) {
        window.clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, [accessToken, queryClient, retryTick]);
}
