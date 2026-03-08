import AsyncStorage from "@react-native-async-storage/async-storage";
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
const LOCAL_ANNIVERSARIES_KEY = "local-anniversaries-v1";
const FALLBACK_ANNIVERSARIES: AnniversaryRecord[] = [
  { id: "fallback-a1", userId: "local-user", name: "햄찌 생일", baseDate: "2024-01-08", ruleType: "yearly", ruleValue: 1, isActive: true },
  { id: "fallback-a2", userId: "local-user", name: "기념일", baseDate: "2024-03-23", ruleType: "yearly", ruleValue: 1, isActive: true },
  { id: "fallback-a3", userId: "local-user", name: "내 생일", baseDate: "2024-08-04", ruleType: "yearly", ruleValue: 1, isActive: true }
];

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
    if (json.success && json.data !== null) return ok(json.data);
    return fail(normalizeErrorCode(json.errorCode), null as T);
  } catch {
    return fail("EXTERNAL_SYNC_FAILED", null as T);
  }
}

async function getLocalAnniversaries(): Promise<AnniversaryRecord[]> {
  const raw = await AsyncStorage.getItem(LOCAL_ANNIVERSARIES_KEY);
  if (!raw) {
    await AsyncStorage.setItem(LOCAL_ANNIVERSARIES_KEY, JSON.stringify(FALLBACK_ANNIVERSARIES));
    return FALLBACK_ANNIVERSARIES;
  }
  try {
    const parsed = JSON.parse(raw) as AnniversaryRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      await AsyncStorage.setItem(LOCAL_ANNIVERSARIES_KEY, JSON.stringify(FALLBACK_ANNIVERSARIES));
      return FALLBACK_ANNIVERSARIES;
    }
    return parsed;
  } catch {
    await AsyncStorage.setItem(LOCAL_ANNIVERSARIES_KEY, JSON.stringify(FALLBACK_ANNIVERSARIES));
    return FALLBACK_ANNIVERSARIES;
  }
}

async function setLocalAnniversaries(items: AnniversaryRecord[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_ANNIVERSARIES_KEY, JSON.stringify(items));
}

function buildLocalMonthItems(month: string, anniversaries: AnniversaryRecord[]): MonthPayload["items"] {
  const [, targetMonth] = month.split("-");
  return anniversaries
    .filter((item) => item.isActive)
    .flatMap((item) => {
      const [, itemMonth, itemDay] = item.baseDate.split("-");
      if (itemMonth !== targetMonth) return [];
      return [{ kind: "anniversary" as const, date: `${month}-${itemDay}`, title: item.name }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchCalendarMonth(role: UserRole | null, month: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", { month, items: [] as MonthPayload["items"] });

  const res = await callServer<MonthPayload>(`/calendar/month-view?month=${encodeURIComponent(month)}`, "GET", auth.role, auth.token);
  if (res.success) return ok(res.data);
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    return ok({ month, items: buildLocalMonthItems(month, local) });
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", { month, items: [] as MonthPayload["items"] });
}

export async function fetchAnniversaries(role: UserRole | null) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", [] as AnniversaryRecord[]);

  const res = await callServer<AnniversaryRecord[]>("/anniversaries", "GET", auth.role, auth.token);
  if (res.success) return ok(res.data);
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") return ok(await getLocalAnniversaries());
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
  if (res.success) return ok(res.data);
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const created: AnniversaryRecord = {
      id: `local-${Date.now().toString(36)}`,
      userId: local[0]?.userId ?? "local-user",
      name: "First Day",
      baseDate: "2024-03-23",
      ruleType: "yearly",
      ruleValue: 1,
      isActive: true
    };
    await setLocalAnniversaries([...local, created]);
    return ok(created);
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function renameAnniversary(role: UserRole | null, anniversaryId: string, nextName: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(`/anniversaries/${encodeURIComponent(anniversaryId)}`, "PATCH", auth.role, auth.token, {
    name: nextName
  });
  if (res.success) return ok(res.data);
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const idx = local.findIndex((item) => item.id === anniversaryId);
    if (idx < 0) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
    const next = [...local];
    next[idx] = { ...next[idx], name: nextName };
    await setLocalAnniversaries(next);
    return ok(next[idx]);
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function removeAnniversary(role: UserRole | null, anniversaryId: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(`/anniversaries/${encodeURIComponent(anniversaryId)}`, "DELETE", auth.role, auth.token);
  if (res.success) return ok(res.data);
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const target = local.find((item) => item.id === anniversaryId) ?? null;
    if (!target) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
    await setLocalAnniversaries(local.filter((item) => item.id !== anniversaryId));
    return ok(target);
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export function mapErrorToMessage(errorCode: ErrorCode | null): string {
  switch (errorCode) {
    case "AUTH_REQUIRED":
      return "로그인이 필요합니다.";
    case "AUTH_SESSION_EXPIRED":
      return "세션이 만료되었습니다. 다시 로그인해 주세요.";
    case "AUTH_INVALID_CREDENTIALS":
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    case "VALIDATION_ERROR":
      return "입력값을 확인해 주세요.";
    case "ANNIVERSARY_NOT_FOUND":
      return "기념일을 찾을 수 없습니다.";
    case "FORBIDDEN_OWNER":
      return "본인 소유 항목만 수정/삭제할 수 있습니다.";
    case "FORBIDDEN_ROLE":
      return "권한이 없습니다.";
    case "EXTERNAL_SYNC_FAILED":
      return "서버 연결에 실패했어요. 로컬 데이터로 표시합니다.";
    default:
      return "예상치 못한 오류가 발생했습니다.";
  }
}
