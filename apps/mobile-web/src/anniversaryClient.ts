import type { UserRole } from "@nahamzzi/domain";
import { requireSession } from "./authClient";

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

interface ServerEnvelope<T> {
  success: boolean;
  data: T | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestId: string;
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

type MonthPayload = { month: string; items: Array<{ kind: "exam" | "anniversary"; date: string; title: string }> };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, errorCode: null };
}

function fail<T>(errorCode: ErrorCode, fallback: T): ApiResponse<T> {
  return { success: false, data: fallback, errorCode };
}

function normalizeErrorCode(code: string | null): ErrorCode {
  switch (code) {
    case "AUTH_REQUIRED":
    case "AUTH_SESSION_EXPIRED":
    case "AUTH_INVALID_CREDENTIALS":
    case "VALIDATION_ERROR":
    case "ANNIVERSARY_NOT_FOUND":
    case "FORBIDDEN_OWNER":
    case "FORBIDDEN_ROLE":
    case "EXTERNAL_SYNC_FAILED":
      return code;
    default:
      return "INTERNAL_ERROR";
  }
}

async function getAuthHeaders(role: UserRole | null): Promise<{ token: string; role: UserRole } | null> {
  if (!role) return null;
  const auth = await requireSession();
  if (!auth.success) return null;
  return { token: auth.session.token, role };
}

async function callServer<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  role: UserRole,
  token: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  if (!API_BASE_URL || API_BASE_URL.trim().length === 0) {
    return fail("EXTERNAL_SYNC_FAILED", null as T);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-User-Role": role
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const json = (await res.json()) as ServerEnvelope<T>;
    if (json.success && json.data !== null) {
      return ok(json.data);
    }

    return fail(normalizeErrorCode(json.errorCode), null as T);
  } catch {
    return fail("EXTERNAL_SYNC_FAILED", null as T);
  }
}

export async function fetchCalendarMonth(role: UserRole | null, month: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) {
    return fail("AUTH_REQUIRED", { month, items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }> });
  }

  const res = await callServer<MonthPayload>(`/calendar/month-view?month=${encodeURIComponent(month)}`, "GET", auth.role, auth.token);
  if (res.success) {
    return ok(res.data);
  }

  return fail(res.errorCode ?? "INTERNAL_ERROR", {
    month,
    items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }>
  });
}

export async function fetchAnniversaries(role: UserRole | null) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", [] as AnniversaryRecord[]);

  const res = await callServer<AnniversaryRecord[]>("/anniversaries", "GET", auth.role, auth.token);
  if (res.success) {
    return ok(res.data);
  }

  return fail(res.errorCode ?? "INTERNAL_ERROR", [] as AnniversaryRecord[]);
}

export async function createDefaultAnniversary(role: UserRole | null) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>("/anniversaries", "POST", auth.role, auth.token, {
    name: "First Day",
    baseDate: "2024-03-23",
    ruleType: "yearly",
    ruleValue: 1
  });

  if (res.success) {
    return ok(res.data);
  }

  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function renameAnniversary(role: UserRole | null, anniversaryId: string, nextName: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(`/anniversaries/${encodeURIComponent(anniversaryId)}`, "PATCH", auth.role, auth.token, {
    name: nextName
  });
  if (res.success) {
    return ok(res.data);
  }

  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function removeAnniversary(role: UserRole | null, anniversaryId: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(`/anniversaries/${encodeURIComponent(anniversaryId)}`, "DELETE", auth.role, auth.token);
  if (res.success) {
    return ok(res.data);
  }

  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
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
