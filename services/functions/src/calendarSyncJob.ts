import { applyCalendarSyncResult, markRetry, planCalendarUpsert } from "./calendarSync";
import type { CalendarSyncEvent } from "./calendarSync";
import { finalizeRetrySuccess, planRetryAfterFailure } from "./retryOrchestration";
import {
  buildCalendarMonthItems,
  buildRelationshipDDayItem,
  buildDualSyncFailureMessage,
  formatCalendarTitle,
  type CalendarMonthItem
} from "@nahamzzi/domain";

export function runCalendarSyncJob(
  event: CalendarSyncEvent,
  remoteSuccess: boolean,
  options?: { retryCount?: number; maxRetries?: number }
) {
  const plan = planCalendarUpsert(event);
  const currentStatus = remoteSuccess
    ? applyCalendarSyncResult(plan.nextStatus, "success")
    : applyCalendarSyncResult(plan.nextStatus, "failed");
  const retryCount = options?.retryCount ?? 0;
  const maxRetries = options?.maxRetries ?? 3;
  const retryPlan = remoteSuccess
    ? finalizeRetrySuccess()
    : planRetryAfterFailure(retryCount, maxRetries);
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
    failureCode: remoteSuccess ? null : retryPlan.state === "manual_review" ? "SYNC_RETRY_EXHAUSTED" : "SYNC_RETRY_SCHEDULED",
    recoveryAction: remoteSuccess ? "none" : retryPlan.state === "manual_review" ? "manual_review" : "retry",
    monthViewItems: monthItems,
    orchestrationState: retryPlan.state,
    retryCount: retryPlan.retryCount,
    retryDelayMs: retryPlan.nextDelayMs,
    finalStatus: currentStatus,
    retryStatus: markRetry(currentStatus)
  };
}
