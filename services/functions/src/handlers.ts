import { failureResponse, successResponse, type ApiResponse } from "./apiResponse";
import { AuthError, requireAuthenticated, requireRole, type RequestActor } from "./auth";
import { recordAuditEvent } from "./auditLog";
import { runCalendarSyncJob } from "./calendarSyncJob";
import { runExamIngestionSync } from "./examIngestionSync";
import { runInterviewSessionCompletion } from "./interviewJob";
import { createRequestContext } from "./requestContext";

function toFailureResponse(error: unknown, requestId: string): ApiResponse<never> {
  if (error instanceof AuthError) {
    return failureResponse(error.code, error.message, requestId);
  }
  return failureResponse("INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.", requestId);
}

export async function handleExamIngestionSync(actor: RequestActor | null = null): Promise<ApiResponse<ReturnType<typeof runExamIngestionSync>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    requireRole(authed, ["A"]);
    const data = runExamIngestionSync([]);
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "exam.ingestion.sync",
      resource: "exam_events",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "exam.ingestion.sync",
      resource: "exam_events",
      outcome: error instanceof AuthError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleCalendarSync(actor: RequestActor | null = null): Promise<ApiResponse<ReturnType<typeof runCalendarSyncJob>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = runCalendarSyncJob(
      { id: "demo", calendarSyncStatus: "not_connected", calendarEventId: null },
      false
    );
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "calendar.sync",
      resource: "exam_events",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "calendar.sync",
      resource: "exam_events",
      outcome: error instanceof AuthError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleInterviewCompletion(actor: RequestActor | null = null): Promise<ApiResponse<Awaited<ReturnType<typeof runInterviewSessionCompletion>>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = await runInterviewSessionCompletion();
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "interview.complete",
      resource: "interview_sessions",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "interview.complete",
      resource: "interview_sessions",
      outcome: error instanceof AuthError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}
