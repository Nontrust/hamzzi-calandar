import { runCalendarSyncJob } from "./calendarSyncJob";
import { runExamIngestionSync } from "./examIngestionSync";
import { runInterviewSessionCompletion } from "./interviewJob";

export async function handleExamIngestionSync() {
  return runExamIngestionSync([]);
}

export async function handleCalendarSync() {
  return runCalendarSyncJob({ id: "demo", calendarSyncStatus: "not_connected", calendarEventId: null }, false);
}

export async function handleInterviewCompletion() {
  return runInterviewSessionCompletion();
}