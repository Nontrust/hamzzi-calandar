import { deduplicateExamEvents } from "./examIngestion";
import type { SourceExamEvent } from "./types";

export interface IngestionResult {
  ingestedCount: number;
  deduplicatedCount: number;
}

export function runExamIngestionSync(rawEvents: SourceExamEvent[]): IngestionResult {
  const normalized = deduplicateExamEvents(rawEvents);

  return {
    ingestedCount: rawEvents.length,
    deduplicatedCount: normalized.length
  };
}