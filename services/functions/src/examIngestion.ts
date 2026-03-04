import type { CanonicalExamEvent, SourceExamEvent } from "./types";

export function buildDedupKey(event: Pick<SourceExamEvent, "organizationName" | "title" | "applyStart" | "applyEnd">): string {
  const applyPeriod = `${event.applyStart ?? "none"}_${event.applyEnd ?? "none"}`;
  return `${event.organizationName.trim()}::${event.title.trim()}::${applyPeriod}`.toLowerCase();
}

export function normalizeExamEvent(event: SourceExamEvent): CanonicalExamEvent {
  return {
    organizationName: event.organizationName,
    title: event.title,
    applyStart: event.applyStart ?? null,
    applyEnd: event.applyEnd ?? null,
    examDate: event.examDate ?? null,
    url: event.url ?? null,
    dedupKey: buildDedupKey(event)
  };
}

export function deduplicateExamEvents(events: SourceExamEvent[]): CanonicalExamEvent[] {
  const map = new Map<string, CanonicalExamEvent>();

  for (const event of events) {
    const normalized = normalizeExamEvent(event);
    if (!map.has(normalized.dedupKey)) {
      map.set(normalized.dedupKey, normalized);
    }
  }

  return [...map.values()];
}