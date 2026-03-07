import { failureResponse, successResponse, type ApiResponse } from "./apiResponse";
import { AuthError, requireAuthenticated, requireRole, type RequestActor } from "./auth";
import {
  AnniversaryError,
  buildAnniversaryMonthItems,
  createAnniversary,
  deleteAnniversary,
  listAnniversaries,
  type CreateAnniversaryInput,
  type UpdateAnniversaryInput,
  updateAnniversary
} from "./anniversaryStore";
import { recordAuditEvent } from "./auditLog";
import { runCalendarSyncJob } from "./calendarSyncJob";
import { runExamIngestionSync } from "./examIngestionSync";
import { runInterviewSessionCompletion } from "./interviewJob";
import { createRequestContext } from "./requestContext";

function toFailureResponse(error: unknown, requestId: string): ApiResponse<never> {
  if (error instanceof AuthError) {
    return failureResponse(error.code, error.message, requestId);
  }
  if (error instanceof AnniversaryError) {
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

export async function handleCreateAnniversary(
  actor: RequestActor | null,
  input: CreateAnniversaryInput
): Promise<ApiResponse<ReturnType<typeof createAnniversary>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = createAnniversary(authed.userId, input, ctx.now);
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "anniversary.create",
      resource: "anniversaries",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "anniversary.create",
      resource: "anniversaries",
      outcome: error instanceof AuthError || error instanceof AnniversaryError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleListAnniversaries(actor: RequestActor | null): Promise<ApiResponse<ReturnType<typeof listAnniversaries>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = listAnniversaries(authed.userId);
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "anniversary.list",
      resource: "anniversaries",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleUpdateAnniversary(
  actor: RequestActor | null,
  anniversaryId: string,
  input: UpdateAnniversaryInput
): Promise<ApiResponse<ReturnType<typeof updateAnniversary>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = updateAnniversary(authed.userId, anniversaryId, input, ctx.now);
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "anniversary.update",
      resource: "anniversaries",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "anniversary.update",
      resource: "anniversaries",
      outcome: error instanceof AuthError || error instanceof AnniversaryError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleDeleteAnniversary(
  actor: RequestActor | null,
  anniversaryId: string
): Promise<ApiResponse<ReturnType<typeof deleteAnniversary>>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const data = deleteAnniversary(authed.userId, anniversaryId, ctx.now);
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "anniversary.delete",
      resource: "anniversaries",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse(data, ctx.requestId);
  } catch (error) {
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: actor?.userId ?? null,
      action: "anniversary.delete",
      resource: "anniversaries",
      outcome: error instanceof AuthError || error instanceof AnniversaryError ? "denied" : "error",
      reason: error instanceof Error ? error.message : "unknown",
      at: ctx.now.toISOString()
    });
    return toFailureResponse(error, ctx.requestId);
  }
}

export async function handleCalendarMonthView(
  actor: RequestActor | null,
  month: string
): Promise<ApiResponse<{ month: string; items: Array<{ kind: "exam" | "anniversary"; date: string; title: string }> }>> {
  const ctx = createRequestContext();
  try {
    const authed = requireAuthenticated(actor);
    const examItems = [
      { kind: "exam" as const, date: `${month}-12`, title: "데이트데이 · [공기업] 필기시험" }
    ];
    const anniversaryItems = buildAnniversaryMonthItems(authed.userId, month);
    const items = [...examItems, ...anniversaryItems].sort((a, b) => a.date.localeCompare(b.date));
    recordAuditEvent({
      requestId: ctx.requestId,
      userId: authed.userId,
      action: "anniversary.month_view",
      resource: "anniversaries",
      outcome: "success",
      at: ctx.now.toISOString()
    });
    return successResponse({ month, items }, ctx.requestId);
  } catch (error) {
    return toFailureResponse(error, ctx.requestId);
  }
}
