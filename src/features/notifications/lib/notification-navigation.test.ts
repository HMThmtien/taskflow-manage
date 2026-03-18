import { describe, expect, it } from "vitest";
import { getNotificationGroupLabel, getNotificationRoute } from "./notification-navigation";

describe("notification-navigation", () => {
  it("returns trimmed route when available", () => {
    expect(
      getNotificationRoute({
        id: "1",
        type: "MENTIONED",
        title: "x",
        body: "y",
        isRead: false,
        createdAt: "2026-01-01T00:00:00Z",
        target: {
          entityType: "ISSUE",
          entityId: "abc",
          route: " /app/projects/123 ",
        },
      })
    ).toBe("/app/projects/123");
  });

  it("groups today and yesterday correctly", () => {
    const now = new Date("2026-03-17T10:00:00Z");
    expect(getNotificationGroupLabel("2026-03-17T01:00:00Z", now)).toBe("Today");
    expect(getNotificationGroupLabel("2026-03-16T10:00:00Z", now)).toBe("Yesterday");
  });
});
