export type OrchestrationState = "pending" | "failed" | "retrying" | "synced" | "manual_review";

export interface RetryPlan {
  state: OrchestrationState;
  retryCount: number;
  nextDelayMs: number | null;
  stopped: boolean;
}

export function nextBackoffDelayMs(retryCount: number, baseMs = 1_000, maxMs = 60_000): number {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, retryCount - 1));
}

export function planRetryAfterFailure(
  retryCount: number,
  maxRetries = 3,
  baseMs = 1_000,
  maxMs = 60_000
): RetryPlan {
  const nextCount = retryCount + 1;
  if (nextCount > maxRetries) {
    return {
      state: "manual_review",
      retryCount,
      nextDelayMs: null,
      stopped: true
    };
  }

  return {
    state: "retrying",
    retryCount: nextCount,
    nextDelayMs: nextBackoffDelayMs(nextCount, baseMs, maxMs),
    stopped: false
  };
}

export function finalizeRetrySuccess(): RetryPlan {
  return {
    state: "synced",
    retryCount: 0,
    nextDelayMs: null,
    stopped: true
  };
}
