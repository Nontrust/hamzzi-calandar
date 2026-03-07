import type { UserRole } from "@nahamzzi/domain";
import { requireSession } from "./authClient";
import {
  actorFromSession,
  handleCalendarMonthView,
  handleCreateAnniversary,
  handleDeleteAnniversary,
  handleListAnniversaries,
  handleUpdateAnniversary
} from "../../../services/functions/src/handlers";

type ErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_INVALID_CREDENTIALS"
  | "VALIDATION_ERROR"
  | "ANNIVERSARY_NOT_FOUND"
  | "FORBIDDEN_OWNER"
  | "FORBIDDEN_ROLE"
  | "EXTERNAL_SYNC_FAILED"
  | "INTERNAL_ERROR";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorCode: ErrorCode | null;
}

interface AnniversaryRecord {
  id: string;
  userId: string;
  name: string;
  baseDate: string;
  ruleType: "day_offset" | "monthly" | "yearly";
  ruleValue: number;
  isActive: boolean;
}

async function actorFromRole(role: UserRole | null): Promise<{ userId: string; role: UserRole } | null> {
  if (!role) return null;
  const auth = await requireSession();
  if (!auth.success) return null;
  return actorFromSession(auth.session.token, role);
}

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, errorCode: null };
}

function fail<T>(errorCode: ErrorCode, fallback: T): ApiResponse<T> {
  return { success: false, data: fallback, errorCode };
}

export async function fetchCalendarMonth(role: UserRole | null, month: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", { month, items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }> });

  const res = await handleCalendarMonthView(actor, month);
  if (res.success) {
    return ok(res.data);
  }

  return fail((res.errorCode as ErrorCode) ?? "INTERNAL_ERROR", {
    month,
    items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }>
  });
}

export async function fetchAnniversaries(role: UserRole | null) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", [] as AnniversaryRecord[]);

  const res = await handleListAnniversaries(actor);
  if (res.success) {
    return ok(res.data);
  }

  return fail((res.errorCode as ErrorCode) ?? "INTERNAL_ERROR", [] as AnniversaryRecord[]);
}

export async function createDefaultAnniversary(role: UserRole | null) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await handleCreateAnniversary(actor, {
    name: "First Day",
    baseDate: "2024-03-23",
    ruleType: "yearly",
    ruleValue: 1
  });

  if (res.success) {
    return ok(res.data);
  }

  return fail((res.errorCode as ErrorCode) ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function renameAnniversary(role: UserRole | null, anniversaryId: string, nextName: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await handleUpdateAnniversary(actor, anniversaryId, { name: nextName });
  if (res.success) {
    return ok(res.data);
  }

  return fail((res.errorCode as ErrorCode) ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function removeAnniversary(role: UserRole | null, anniversaryId: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await handleDeleteAnniversary(actor, anniversaryId);
  if (res.success) {
    return ok(res.data);
  }

  return fail((res.errorCode as ErrorCode) ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export function mapErrorToMessage(errorCode: ErrorCode | null): string {
  switch (errorCode) {
    case "AUTH_REQUIRED":
      return "Login is required.";
    case "AUTH_SESSION_EXPIRED":
      return "Session expired. Please log in again.";
    case "AUTH_INVALID_CREDENTIALS":
      return "Invalid login ID or password.";
    case "VALIDATION_ERROR":
      return "Please check your input.";
    case "ANNIVERSARY_NOT_FOUND":
      return "Anniversary not found.";
    case "FORBIDDEN_OWNER":
      return "Only owner can edit or delete this record.";
    case "FORBIDDEN_ROLE":
      return "You do not have permission for this action.";
    case "EXTERNAL_SYNC_FAILED":
      return "External calendar sync failed. Try again later.";
    default:
      return "Unexpected server error.";
  }
}
