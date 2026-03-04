import { describe, expect, it } from "vitest";
import { deduplicateExamEvents } from "../src/examIngestion";
import { applyCalendarSyncResult, markRetry } from "../src/calendarSync";
import { validateInterviewReport } from "../src/interviewReport";
import { runCalendarSyncJob } from "../src/calendarSyncJob";
import { runInterviewSessionCompletion } from "../src/interviewJob";
import { clearAuditEvents, listAuditEvents } from "../src/auditLog";
import { handleCalendarSync, handleExamIngestionSync, handleInterviewCompletion } from "../src/handlers";
import { finalizeRetrySuccess, nextBackoffDelayMs, planRetryAfterFailure } from "../src/retryOrchestration";
import {
  clearTokenStore,
  decryptToken,
  getExternalToken,
  refreshExternalToken,
  saveExternalToken,
  shouldRefreshToken
} from "../src/tokenLifecycle";
import {
  HAMJJI_BRAND_LEXICON,
  buildAnniversaryItem,
  buildRelationshipDDayItem,
  calculateAnniversaryDate,
  calculateRelationshipDayCount,
  containsBlockedWord,
  formatAnniversaryHint,
  formatAnniversaryTitle,
  formatRelationshipDDay,
  getBrandLabel,
  getRoleLabel,
  validateLexicon
} from "@nahamzzi/domain";

describe("integration domain behavior", () => {
  it("deduplicates exam events by dedup key", () => {
    const events = deduplicateExamEvents([
      { organizationName: "기관A", title: "공채", applyStart: "2026-03-01", applyEnd: "2026-03-10" },
      { organizationName: "기관A", title: "공채", applyStart: "2026-03-01", applyEnd: "2026-03-10" }
    ]);

    expect(events).toHaveLength(1);
  });

  it("applies sync status transitions for success/failure/retry", () => {
    expect(applyCalendarSyncResult("pending", "success")).toBe("synced");
    expect(applyCalendarSyncResult("pending", "failed")).toBe("failed");
    expect(markRetry("failed")).toBe("pending");
  });

  it("validates interview report required fields", () => {
    expect(() =>
      validateInterviewReport({
        strengths: ["a", "b", "c"],
        improvements: ["a", "b", "c"],
        improvedSampleAnswer: "ok",
        expectedFollowUps: ["1", "2", "3", "4", "5"],
        scores: { structure: 3, specificity: 3, roleFit: 3, publicValue: 3, clarity: 3 }
      })
    ).not.toThrow();
  });

  it("validates hamjji lexicon schema with 10+ samples", () => {
    expect(HAMJJI_BRAND_LEXICON.length).toBeGreaterThanOrEqual(10);
    expect(validateLexicon(HAMJJI_BRAND_LEXICON)).toBe(true);
  });

  it("blocks banned words and supports fallback labels", () => {
    expect(containsBlockedWord("멍청한 표현")).toBe(true);
    expect(getBrandLabel("role.userA", true)).toBe("햄찌메이트");
    expect(getBrandLabel("not.exists", true)).toBe("not.exists");
    expect(getRoleLabel("B", true)).toBe("나햄찌");
  });

  it("creates branded calendar title and dual failure message", () => {
    const result = runCalendarSyncJob(
      { id: "1", calendarSyncStatus: "not_connected", calendarEventId: null },
      false
    );
    expect(result.titleTemplate).toContain("데이트데이");
    expect(result.failureMessage).toContain("다시 시도");
    expect(result.monthViewItems.some((item) => item.kind === "anniversary")).toBe(true);
    expect(result.failureCode).toBe("SYNC_RETRY_SCHEDULED");
    expect(result.orchestrationState).toBe("retrying");
    expect(result.finalStatus).toBe("failed");
  });

  it("returns branded interview header and safe feedback", async () => {
    const result = await runInterviewSessionCompletion();
    expect(result.modeLabel).toBe("면접 연습 모드");
    expect(result.reportHeader).toBe("면접 피드백 노트");
    expect(result.report.strengths).toHaveLength(3);
  });

  it("formats anniversary title and d-day helper copy", () => {
    expect(formatAnniversaryTitle("햄찌데이", 100)).toBe("햄찌데이 · D+100");
    expect(formatAnniversaryHint("2026-03-04", "2026-03-12")).toContain("8일 남");
    expect(formatAnniversaryHint("2026-03-04", "2026-03-04")).toContain("오늘");
    expect(formatAnniversaryHint("2026-03-04", "2026-03-01")).toContain("3일 지났");

    const item = buildAnniversaryItem(
      { name: "햄찌데이", baseDate: "2024-03-23", dayOffset: 100 },
      "2026-03-04"
    );
    expect(item.title).toContain("D+100");
    expect(item.hint).toContain("기준일");
  });

  it("calculates relationship D-day from the couple start date", () => {
    expect(calculateRelationshipDayCount("2024-03-23", "2024-03-23")).toBe(1);
    expect(calculateRelationshipDayCount("2024-03-23", "2024-03-24")).toBe(2);
    expect(formatRelationshipDDay("2024-03-23", "2026-03-04")).toContain("D+");

    const dday = buildRelationshipDDayItem("사귄날", "2024-03-23", "2026-03-04");
    expect(dday.title).toContain("사귄날 · D+");
    expect(dday.dDayLabel).toContain("일째");
  });

  it("calculates anniversary dates for day/year/month and boundary cases", () => {
    expect(
      calculateAnniversaryDate({ name: "100일", baseDate: "2024-03-23", dayOffset: 100 }, "2026-03-01")
    ).toBe("2024-06-30");

    expect(
      calculateAnniversaryDate({ name: "1주년", baseDate: "2024-03-23", yearInterval: 1 }, "2026-01-01")
    ).toBe("2026-03-23");

    expect(
      calculateAnniversaryDate({ name: "월말", baseDate: "2026-01-31", monthInterval: 1 }, "2026-02-01")
    ).toBe("2026-02-28");

    expect(
      calculateAnniversaryDate({ name: "윤년", baseDate: "2024-02-29", yearInterval: 1 }, "2025-01-01")
    ).toBe("2025-02-28");
  });

  it("returns standard response envelope for success and auth failure", async () => {
    const ok = await handleInterviewCompletion({ userId: "u1", role: "B" });
    expect(ok.success).toBe(true);
    expect(ok.requestId).toBeTruthy();

    const denied = await handleExamIngestionSync({ userId: "u2", role: "B" });
    expect(denied.success).toBe(false);
    if (!denied.success) {
      expect(denied.errorCode).toBe("FORBIDDEN_ROLE");
      expect(denied.requestId).toBeTruthy();
    }
  });

  it("records audit events with requestId for denied and success flows", async () => {
    clearAuditEvents();
    await handleCalendarSync({ userId: "u1", role: "A" });
    await handleExamIngestionSync({ userId: "u2", role: "B" });
    const events = listAuditEvents();
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.every((event) => event.requestId.length > 0)).toBe(true);
    expect(events.some((event) => event.outcome === "denied")).toBe(true);
  });

  it("handles external token lifecycle with pre-refresh and reauth fallback", async () => {
    clearTokenStore();
    const now = new Date("2026-03-04T00:00:00.000Z");
    const token = saveExternalToken(
      "google_calendar",
      "user-a",
      "access-old",
      "refresh-old",
      "2026-03-04T00:20:00.000Z",
      now
    );
    expect(shouldRefreshToken(token.expiresAt, now, 30)).toBe(true);

    const refreshed = await refreshExternalToken(
      token,
      now,
      async () => ({
        accessToken: "access-new",
        refreshToken: "refresh-new",
        expiresAt: "2026-03-05T00:00:00.000Z"
      })
    );
    expect(refreshed.errorCode).toBeNull();
    expect(decryptToken(refreshed.record.encryptedAccessToken)).toBe("access-new");

    const failed = await refreshExternalToken(
      { ...refreshed.record, retryCount: 2 },
      now,
      async () => {
        throw new Error("refresh failed");
      }
    );
    expect(failed.errorCode).toBe("TOKEN_REAUTH_REQUIRED");
    expect(getExternalToken("google_calendar", "user-a")?.state).toBe("reauth_required");
  });

  it("applies retry orchestration with backoff and max-retry guard", () => {
    expect(nextBackoffDelayMs(1)).toBe(1000);
    expect(nextBackoffDelayMs(2)).toBe(2000);

    const retrying = planRetryAfterFailure(0, 3);
    expect(retrying.state).toBe("retrying");
    expect(retrying.nextDelayMs).toBe(1000);

    const exhausted = planRetryAfterFailure(3, 3);
    expect(exhausted.state).toBe("manual_review");
    expect(exhausted.stopped).toBe(true);

    const done = finalizeRetrySuccess();
    expect(done.state).toBe("synced");
  });
});
