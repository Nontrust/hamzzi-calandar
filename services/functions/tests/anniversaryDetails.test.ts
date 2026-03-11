import { describe, expect, it } from "vitest";
import { handleCalendarMonthView, handleCreateAnniversary } from "../src/handlers";
import { clearAnniversaryStore } from "../src/anniversaryStore";

describe("anniversary detail persistence", () => {
  it("persists detailed fields and exposes metadata in month-view", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const created = await handleCreateAnniversary(actor, {
      name: "Detailed Anniversary",
      baseDate: "2024-03-23",
      category: "anniversary",
      note: "Detailed note for summary rendering",
      reminderEnabled: true,
      reminderOffsetDays: 5,
      ruleType: "yearly",
      ruleValue: 1
    });
    expect(created.success).toBe(true);
    if (!created.success) return;
    expect(created.data.category).toBe("anniversary");
    expect(created.data.reminderEnabled).toBe(true);
    expect(created.data.reminderOffsetDays).toBe(5);
    expect(created.data.note).toContain("Detailed note");

    const month = await handleCalendarMonthView(actor, "2026-03");
    expect(month.success).toBe(true);
    if (!month.success) return;
    const target = month.data.items.find((item) => item.kind === "anniversary" && item.title.includes("Detailed Anniversary"));
    expect(target).toBeDefined();
    expect(target?.category).toBe("anniversary");
    expect(target?.reminderEnabled).toBe(true);
    expect(target?.noteSummary).toBeTruthy();
    expect(target?.ruleType).toBe("yearly");
  });

  it("rejects invalid detail combination with validation error", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };
    const bad = await handleCreateAnniversary(actor, {
      name: "Invalid Monthly Rule",
      baseDate: "2024-03-23",
      category: "study",
      note: "",
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "monthly",
      ruleValue: 99
    } as never);
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.errorCode).toBe("VALIDATION_ERROR");
    }
  });
});
