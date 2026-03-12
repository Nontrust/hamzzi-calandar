import { describe, expect, it } from "vitest";
import {
  handleCalendarMonthView,
  handleCreateAnniversary,
  handleDeleteAnniversary,
  handleListAnniversaries,
  handleUpdateAnniversary
} from "../src/handlers";
import { clearAnniversaryStore, createAnniversary } from "../src/anniversaryStore";

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
      category: "other",
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

  it("prevents deleting locked default anniversaries", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const listed = await handleListAnniversaries(actor);
    expect(listed.success).toBe(true);
    if (!listed.success) return;

    const locked = listed.data.find((item) => item.isDeleteLocked && item.userId === "user-a");
    expect(locked).toBeDefined();
    if (!locked) return;

    const deleted = await handleDeleteAnniversary(actor, locked.id);
    expect(deleted.success).toBe(false);
    if (!deleted.success) {
      expect(deleted.errorCode).toBe("ANNIVERSARY_DELETE_LOCKED");
    }
  });

  it("prevents editing locked default anniversaries", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const listed = await handleListAnniversaries(actor);
    expect(listed.success).toBe(true);
    if (!listed.success) return;

    const locked = listed.data.find((item) => item.isDeleteLocked && item.userId === "user-a");
    expect(locked).toBeDefined();
    if (!locked) return;

    const updated = await handleUpdateAnniversary(actor, locked.id, { note: "blocked edit" });
    expect(updated.success).toBe(false);
    if (!updated.success) {
      expect(updated.errorCode).toBe("ANNIVERSARY_EDIT_LOCKED");
    }
  });

  it("prevents editing relationship anniversaries", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const created = await createAnniversary(
      "user-a",
      {
        name: "Relationship Day",
        baseDate: "2024-03-23",
        category: "relationship",
        note: "",
        reminderEnabled: false,
        reminderOffsetDays: 0,
        ruleType: "yearly",
        ruleValue: 1
      },
      new Date(),
      { allowManagedCategories: true }
    );

    const updated = await handleUpdateAnniversary(actor, created.id, { note: "blocked edit" });
    expect(updated.success).toBe(false);
    if (!updated.success) {
      expect(updated.errorCode).toBe("ANNIVERSARY_EDIT_LOCKED");
    }
  });

  it("shows both demo users anniversaries together", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const listed = await handleListAnniversaries(actor);
    expect(listed.success).toBe(true);
    if (!listed.success) return;

    const userIds = new Set(listed.data.map((item) => item.userId));
    expect(userIds.has("user-a")).toBe(true);
    expect(userIds.has("user-b")).toBe(true);
  });

  it("includes relationship 100-day milestones and yearly anniversaries in month view", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    await createAnniversary(
      "user-a",
      {
        name: "Hamzzi Day",
        baseDate: "2024-03-23",
        category: "relationship",
        note: "",
        reminderEnabled: false,
        reminderOffsetDays: 0,
        ruleType: "yearly",
        ruleValue: 1
      },
      new Date(),
      { allowManagedCategories: true }
    );

    const hundredMonth = await handleCalendarMonthView(actor, "2024-06");
    expect(hundredMonth.success).toBe(true);
    if (!hundredMonth.success) return;
    expect(hundredMonth.data.items.some((item) => item.title.includes("100"))).toBe(true);

    const yearlyMonth = await handleCalendarMonthView(actor, "2025-03");
    expect(yearlyMonth.success).toBe(true);
    if (!yearlyMonth.success) return;
    expect(yearlyMonth.data.items.some((item) => item.title.includes("1주년"))).toBe(true);
  });

  it("shows shared birthday records for both demo users", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const listed = await handleListAnniversaries(actor);
    expect(listed.success).toBe(true);
    if (!listed.success) return;

    const sharedBirthdays = listed.data.filter((item) => item.category === "birthday");
    expect(sharedBirthdays.length).toBeGreaterThanOrEqual(4);
    expect(new Set(sharedBirthdays.map((item) => item.userId))).toEqual(new Set(["user-a", "user-b"]));
  });

  it("prevents creating birthday anniversaries manually", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const created = await handleCreateAnniversary(actor, {
      name: "Shared Birthday",
      baseDate: "2000-12-25",
      category: "birthday",
      note: "",
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "yearly",
      ruleValue: 1
    });
    expect(created.success).toBe(false);
    if (!created.success) {
      expect(created.errorCode).toBe("ANNIVERSARY_CREATE_LOCKED");
    }
  });

  it("prevents deleting relationship anniversaries", async () => {
    clearAnniversaryStore();
    const actor = { userId: "user-a", role: "A" as const };

    const relationshipItem = await createAnniversary(
      "user-a",
      {
        name: "Hamzzi Day",
        baseDate: "2024-03-23",
        category: "relationship",
        note: "",
        reminderEnabled: false,
        reminderOffsetDays: 0,
        ruleType: "yearly",
        ruleValue: 1
      },
      new Date(),
      { allowManagedCategories: true }
    );

    const deleted = await handleDeleteAnniversary(actor, relationshipItem.id);
    expect(deleted.success).toBe(false);
    if (!deleted.success) {
      expect(deleted.errorCode).toBe("ANNIVERSARY_DELETE_LOCKED");
    }
  });
});



