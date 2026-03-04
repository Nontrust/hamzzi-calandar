import { describe, expect, it } from "vitest";
import { deduplicateExamEvents } from "../src/examIngestion";
import { applyCalendarSyncResult, markRetry } from "../src/calendarSync";
import { validateInterviewReport } from "../src/interviewReport";
import { runCalendarSyncJob } from "../src/calendarSyncJob";
import { runInterviewSessionCompletion } from "../src/interviewJob";
import {
  HAMJJI_BRAND_LEXICON,
  containsBlockedWord,
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
    expect(result.finalStatus).toBe("failed");
  });

  it("returns branded interview header and safe feedback", async () => {
    const result = await runInterviewSessionCompletion();
    expect(result.modeLabel).toBe("면접 연습 모드");
    expect(result.reportHeader).toBe("면접 피드백 노트");
    expect(result.report.strengths).toHaveLength(3);
  });
});
