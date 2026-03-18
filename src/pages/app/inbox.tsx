import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PageState } from "@/components/app/page-state";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/api/notifications.queries";
import {
  getNotificationGroupLabel,
  getNotificationRoute,
} from "@/features/notifications/lib/notification-navigation";
import type { NotificationItem } from "@/features/notifications/types/notifications.types";

type NotificationGroup = {
  label: string;
  items: NotificationItem[];
};

export default function InboxPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();
  const query = useNotificationsQuery({ unreadOnly, page: 1, pageSize: 20 });
  const markOne = useMarkNotificationAsReadMutation();
  const markAll = useMarkAllNotificationsAsReadMutation();

  const groupedItems = useMemo<NotificationGroup[]>(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const item of query.data?.items ?? []) {
      const label = getNotificationGroupLabel(item.createdAt);
      const current = map.get(label) ?? [];
      current.push(item);
      map.set(label, current);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [query.data?.items]);

  async function openNotification(item: NotificationItem) {
    const route = getNotificationRoute(item);
    if (!item.isRead) {
      await markOne.mutateAsync(item.id);
    }
    if (route) {
      navigate(route);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("inbox.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("inbox.description")}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUnreadOnly((value) => !value)}>
            {unreadOnly ? t("inbox.showAll") : t("inbox.unreadOnly")}
          </Button>
          <Button onClick={() => markAll.mutate()}>{t("inbox.markAllAsRead")}</Button>
        </div>
      </div>

      {query.isLoading ? (
        <PageState kind="loading" title={t("common.loading")} description={t("inbox.description")} />
      ) : null}
      {query.isError ? (
        <PageState
          kind="error"
          title={t("inbox.error")}
          description="Notifications could not be loaded right now."
          actionLabel={t("common.retry")}
          onAction={() => {
            void query.refetch();
          }}
        />
      ) : null}

      {!query.isLoading && !query.isError ? <div className="space-y-6">
        {groupedItems.map((group) => (
          <section key={group.label} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </div>

            <div className="space-y-3">
              {group.items.map((item) => {
                const route = getNotificationRoute(item);

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      item.isRead
                        ? "border-border/70 bg-background/75"
                        : "border-emerald-500/80 bg-emerald-500/5 hover:bg-emerald-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        type="button"
                        className="flex-1 space-y-1 text-left"
                        onClick={() => void openNotification(item)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{item.title}</div>
                          {!item.isRead ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.body}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {!item.isRead ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markOne.mutate(String(item.id))}
                          >
                            {t("inbox.markRead")}
                          </Button>
                        ) : null}

                        {route ? (
                          <Button variant="ghost" size="icon" onClick={() => void openNotification(item)}>
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {!query.isLoading && (query.data?.items.length ?? 0) === 0 ? (
          <PageState kind="empty" title={t("inbox.empty")} description={t("inbox.description")} />
        ) : null}
      </div> : null}
    </div>
  );
}
