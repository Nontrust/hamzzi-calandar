export type UserRole = "A" | "B";

export type CalendarSyncStatus = "not_connected" | "pending" | "synced" | "failed";

export function canManageRewards(role: UserRole): boolean {
  return role === "A";
}

export function nextSyncStatus(current: CalendarSyncStatus, event: "connect" | "success" | "error" | "retry"): CalendarSyncStatus {
  switch (event) {
    case "connect":
      return "pending";
    case "success":
      return "synced";
    case "error":
      return "failed";
    case "retry":
      return current === "failed" ? "pending" : current;
    default:
      return current;
  }
}

export * from "./hamjjiLexicon";
export * from "./anniversary";
