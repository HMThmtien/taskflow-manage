import { describe, expect, it } from "vitest";
import { applyIncomingNotification } from "./notifications.queries";

describe("applyIncomingNotification", () => {
  it("prepends a new unread notification and updates counters", () => {
    const next = applyIncomingNotification(
      {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        unreadCount: 0,
      },
      {
        id: "n-1",
        type: "MENTIONED",
        title: "Mentioned",
        body: "Body",
        isRead: false,
        createdAt: "2026-03-17T10:00:00Z",
      }
    );

    expect(next.items).toHaveLength(1);
    expect(next.total).toBe(1);
    expect(next.unreadCount).toBe(1);
  });

  it("removes read notifications from unread-only list", () => {
    const next = applyIncomingNotification(
      {
        items: [
          {
            id: "n-1",
            type: "MENTIONED",
            title: "Mentioned",
            body: "Body",
            isRead: false,
            createdAt: "2026-03-17T10:00:00Z",
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        unreadCount: 1,
      },
      {
        id: "n-1",
        type: "MENTIONED",
        title: "Mentioned",
        body: "Body",
        isRead: true,
        createdAt: "2026-03-17T10:00:00Z",
      },
      { unreadOnly: true, page: 1, pageSize: 20 }
    );

    expect(next.items).toHaveLength(0);
    expect(next.unreadCount).toBe(0);
  });
});
