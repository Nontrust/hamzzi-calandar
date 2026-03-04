export interface SourceExamEvent {
  organizationName: string;
  title: string;
  applyStart?: string;
  applyEnd?: string;
  examDate?: string;
  url?: string;
}

export interface CanonicalExamEvent {
  organizationName: string;
  title: string;
  applyStart: string | null;
  applyEnd: string | null;
  examDate: string | null;
  url: string | null;
  dedupKey: string;
}

export type SyncStatus = "not_connected" | "pending" | "synced" | "failed";

export type JobSyncState = "pending" | "failed" | "retrying" | "synced" | "manual_review";
