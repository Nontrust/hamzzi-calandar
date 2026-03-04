import { applyCalendarSyncResult, markRetry, planCalendarUpsert } from "./calendarSync";
import type { CalendarSyncEvent } from "./calendarSync";
import {
  buildCalendarMonthItems,
  buildRelationshipDDayItem,
  buildDualSyncFailureMessage,
  formatCalendarTitle,
  type CalendarMonthItem
} from "@nahamzzi/domain";

export function runCalendarSyncJob(event: CalendarSyncEvent, remoteSuccess: boolean) {
  const plan = planCalendarUpsert(event);
  const currentStatus = remoteSuccess
    ? applyCalendarSyncResult(plan.nextStatus, "success")
    : applyCalendarSyncResult(plan.nextStatus, "failed");
  const today = "2026-03-04";
  const anniversary = buildRelationshipDDayItem("사귄날", "2024-03-23", today);
  const monthItems = buildCalendarMonthItems(
    "2026-03",
    [{ kind: "exam", date: "2026-03-12", title: "데이트데이 · [공기업] 필기시험" } satisfies CalendarMonthItem],
    [anniversary]
  );

  return {
    action: plan.action,
    titleTemplate: formatCalendarTitle("공기업", "exam", true),
    failureMessage: buildDualSyncFailureMessage(),
    monthViewItems: monthItems,
    finalStatus: currentStatus,
    retryStatus: markRetry(currentStatus)
  };
}
