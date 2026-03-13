import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n";
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from "@/features/notifications/api/notifications.queries";

export default function InboxPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { t } = useI18n();
  const query = useNotificationsQuery({ unreadOnly, page: 1, pageSize: 20 });
  const markOne = useMarkNotificationAsReadMutation();
  const markAll = useMarkAllNotificationsAsReadMutation();

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

      {query.isLoading ? <div>{t("common.loading")}</div> : null}
      {query.isError ? <div className="text-destructive">{t("inbox.error")}</div> : null}

      <div className="space-y-3">
        {query.data?.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border p-4 ${item.isRead ? "" : "border-emerald-500"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.body}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              {!item.isRead ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markOne.mutate(String(item.id))}
                >
                  {t("inbox.markRead")}
                </Button>
              ) : null}
            </div>
          </div>
        ))}

        {!query.isLoading && query.data?.items.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            {t("inbox.empty")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
