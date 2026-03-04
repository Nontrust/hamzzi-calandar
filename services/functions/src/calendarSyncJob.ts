import { applyCalendarSyncResult, markRetry, planCalendarUpsert } from "./calendarSync";
import type { CalendarSyncEvent } from "./calendarSync";
import {
  buildAnniversaryItem,
  buildCalendarMonthItems,
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
  const anniversary = buildAnniversaryItem(
    { name: "햄찌데이", baseDate: "2025-11-25", dayOffset: 100 },
    today
  );
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
