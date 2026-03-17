import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ToastAction } from "@/components/ui/toast";
import {
  applyIncomingNotification,
  notificationsKeys,
  type NotificationsListParams,
} from "@/features/notifications/api/notifications.queries";
import { getNotificationRoute } from "@/features/notifications/lib/notification-navigation";
import type { NotificationItem, NotificationsResponse } from "@/features/notifications/types/notifications.types";
import type { IssueActivity } from "@/features/issues/api/useIssueActivities";
import type { IssueComment } from "@/features/issues/api/useIssueComments";
import { toast } from "@/hooks/use-toast";
import { openAuthEventStream } from "@/services/api/client";
import { useAuthStore } from "@/stores/auth.store";

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
  const navigate = useNavigate();
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

          const cachedQueries = queryClient.getQueriesData<NotificationsResponse>({
            queryKey: notificationsKeys.all,
          });

          for (const [queryKey, current] of cachedQueries) {
            if (!current) continue;

            const [, params] = queryKey;
            queryClient.setQueryData<NotificationsResponse>(queryKey, () =>
              applyIncomingNotification(
                current,
                notification,
                (params as NotificationsListParams | undefined) ?? undefined
              )
            );
          }

          const route = getNotificationRoute(notification);
          toast({
            title: notification.title,
            description: notification.body,
            action: route ? (
              <ToastAction altText="Open notification" onClick={() => navigate(route)}>
                Open
              </ToastAction>
            ) : undefined,
          });
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
  }, [accessToken, navigate, queryClient, retryTick]);
}
