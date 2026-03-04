import { deduplicateExamEvents } from "./examIngestion";
import { finalizeRetrySuccess, planRetryAfterFailure } from "./retryOrchestration";
import type { SourceExamEvent } from "./types";
import type { OrchestrationState } from "./retryOrchestration";

export interface IngestionResult {
  ingestedCount: number;
  deduplicatedCount: number;
  state: OrchestrationState;
  retryCount: number;
  retryDelayMs: number | null;
}

export function runExamIngestionSync(
  rawEvents: SourceExamEvent[],
  options?: { remoteSuccess?: boolean; retryCount?: number; maxRetries?: number }
): IngestionResult {
  const normalized = deduplicateExamEvents(rawEvents);
  const remoteSuccess = options?.remoteSuccess ?? true;
  const retryCount = options?.retryCount ?? 0;
  const maxRetries = options?.maxRetries ?? 3;

  if (!remoteSuccess) {
    const plan = planRetryAfterFailure(retryCount, maxRetries);
    return {
      ingestedCount: rawEvents.length,
      deduplicatedCount: normalized.length,
      state: plan.state,
      retryCount: plan.retryCount,
      retryDelayMs: plan.nextDelayMs
    };
  }

  const done = finalizeRetrySuccess();

  return {
    ingestedCount: rawEvents.length,
    deduplicatedCount: normalized.length,
    state: done.state,
    retryCount: done.retryCount,
    retryDelayMs: done.nextDelayMs
  };
}
