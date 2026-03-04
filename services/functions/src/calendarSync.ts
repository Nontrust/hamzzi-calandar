import { nextSyncStatus, type CalendarSyncStatus } from "@nahamzzi/domain";

type SyncResult = "success" | "failed";

export interface CalendarSyncEvent {
  id: string;
  calendarSyncStatus: CalendarSyncStatus;
  calendarEventId: string | null;
}

export function planCalendarUpsert(event: CalendarSyncEvent): { action: "create" | "update"; nextStatus: CalendarSyncStatus } {
  const action = event.calendarEventId ? "update" : "create";
  const nextStatus = nextSyncStatus(event.calendarSyncStatus, "connect");
  return { action, nextStatus };
}

export function applyCalendarSyncResult(currentStatus: CalendarSyncStatus, result: SyncResult): CalendarSyncStatus {
  return result === "success" ? nextSyncStatus(currentStatus, "success") : nextSyncStatus(currentStatus, "error");
}

export function markRetry(currentStatus: CalendarSyncStatus): CalendarSyncStatus {
  return nextSyncStatus(currentStatus, "retry");
}