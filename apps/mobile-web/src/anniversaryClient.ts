import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserRole } from "@nahamzzi/domain";
import { requireSession } from "./authClient";

type ErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_INVALID_CREDENTIALS"
  | "VALIDATION_ERROR"
  | "ANNIVERSARY_CREATE_LOCKED"
  | "ANNIVERSARY_NOT_FOUND"
  | "ANNIVERSARY_EDIT_LOCKED"
  | "ANNIVERSARY_DELETE_LOCKED"
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
}

export type AnniversaryCategory = "birthday" | "relationship" | "anniversary" | "other";
export type AnniversaryRuleType = "day_offset" | "monthly" | "yearly";

export interface AnniversaryRecord {
  id: string;
  userId: string;
  name: string;
  baseDate: string;
  category: AnniversaryCategory;
  note: string;
  reminderEnabled: boolean;
  reminderOffsetDays: number;
  ruleType: AnniversaryRuleType;
  ruleValue: number;
  isActive: boolean;
  isDeleteLocked: boolean;
}

export interface AnniversaryUpsertInput {
  name: string;
  baseDate: string;
  category: AnniversaryCategory;
  note: string;
  reminderEnabled: boolean;
  reminderOffsetDays: number;
  ruleType: AnniversaryRuleType;
  ruleValue: number;
}

type MonthItem = {
  kind: "exam" | "anniversary";
  date: string;
  title: string;
  category?: AnniversaryCategory;
  reminderEnabled?: boolean;
  noteSummary?: string;
  ruleType?: AnniversaryRuleType;
};

type MonthPayload = { month: string; items: MonthItem[] };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const LOCAL_ANNIVERSARIES_KEY = "local-anniversaries-v2";

function getSharedFallbackAnniversaries(): AnniversaryRecord[] {
  return [
    {
      id: "fallback-birthday-me",
      userId: "shared",
      name: "내 생일",
      baseDate: "1995-08-04",
      category: "birthday",
      note: "",
      reminderEnabled: true,
      reminderOffsetDays: 5,
      ruleType: "yearly",
      ruleValue: 1,
      isActive: true,
      isDeleteLocked: true
    },
    {
      id: "fallback-birthday-hamzzi",
      userId: "shared",
      name: "햄찌 생일",
      baseDate: "1998-01-08",
      category: "birthday",
      note: "",
      reminderEnabled: true,
      reminderOffsetDays: 3,
      ruleType: "yearly",
      ruleValue: 1,
      isActive: true,
      isDeleteLocked: true
    },
    {
      id: "fallback-relationship-hamzzi",
      userId: "shared",
      name: "햄찌 주운날",
      baseDate: "2024-03-23",
      category: "relationship",
      note: "",
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "yearly",
      ruleValue: 1,
      isActive: true,
      isDeleteLocked: false
    }
  ];
}

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
    case "ANNIVERSARY_CREATE_LOCKED":
    case "ANNIVERSARY_NOT_FOUND":
    case "ANNIVERSARY_EDIT_LOCKED":
    case "ANNIVERSARY_DELETE_LOCKED":
    case "FORBIDDEN_OWNER":
    case "FORBIDDEN_ROLE":
    case "EXTERNAL_SYNC_FAILED":
      return code;
    default:
      return "INTERNAL_ERROR";
  }
}

function normalizeRecord(record: Partial<AnniversaryRecord> & Pick<AnniversaryRecord, "id" | "userId" | "name" | "baseDate" | "ruleType" | "ruleValue" | "isActive">): AnniversaryRecord {
  return {
    ...record,
    category: record.category ?? "anniversary",
    note: record.note ?? "",
    reminderEnabled: record.reminderEnabled ?? false,
    reminderOffsetDays: record.reminderOffsetDays ?? 0,
    isDeleteLocked: record.isDeleteLocked ?? false
  };
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
    const fallback = getSharedFallbackAnniversaries();
    await setLocalAnniversaries(fallback);
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as AnniversaryRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const fallback = getSharedFallbackAnniversaries();
      await setLocalAnniversaries(fallback);
      return fallback;
    }
    const normalized = parsed.map((item) => normalizeRecord(item));
    const hasRelationship = normalized.some((item) => item.category === "relationship");
    if (hasRelationship) return normalized;

    const merged = [...normalized, ...getSharedFallbackAnniversaries().filter((item) => item.category === "relationship")];
    await setLocalAnniversaries(merged);
    return merged;
  } catch {
    const fallback = getSharedFallbackAnniversaries();
    await setLocalAnniversaries(fallback);
    return fallback;
  }
}

async function setLocalAnniversaries(items: AnniversaryRecord[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_ANNIVERSARIES_KEY, JSON.stringify(items));
}

function summarizeNote(note: string): string {
  const trimmed = (note ?? "").trim();
  if (!trimmed) return "";
  return trimmed.length > 26 ? `${trimmed.slice(0, 26)}...` : trimmed;
}

function formatRelationshipMilestoneTitle(name: string, dayCount: number) {
  return `${name} ${dayCount}일`;
}

function formatRelationshipYearlyTitle(name: string, years: number) {
  return `${name} ${years}주년`;
}

function buildLocalMonthItems(month: string, anniversaries: AnniversaryRecord[]): MonthPayload["items"] {
  const [targetYear, targetMonth] = month.split("-").map(Number);
  return anniversaries
    .filter((item) => item.isActive)
    .flatMap((item) => {
      const [baseYear, itemMonth, itemDay] = item.baseDate.split("-").map(Number);

      if (item.category === "relationship") {
        const results: MonthPayload["items"] = [];
        const monthStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
        const monthEnd = new Date(Date.UTC(targetYear, targetMonth, 0));
        const base = new Date(Date.UTC(baseYear, itemMonth - 1, itemDay));

        for (let dayCount = 100; dayCount <= 50000; dayCount += 100) {
          const target = new Date(base.getTime() + (dayCount - 1) * 24 * 60 * 60 * 1000);
          if (target < monthStart) continue;
          if (target > monthEnd) break;

          const y = target.getUTCFullYear();
          const m = `${target.getUTCMonth() + 1}`.padStart(2, "0");
          const d = `${target.getUTCDate()}`.padStart(2, "0");
          results.push({
            kind: "anniversary" as const,
            date: `${y}-${m}-${d}`,
            title: formatRelationshipMilestoneTitle(item.name, dayCount),
            category: item.category,
            reminderEnabled: item.reminderEnabled,
            noteSummary: summarizeNote(item.note),
            ruleType: item.ruleType
          });
        }

        if (itemMonth === targetMonth) {
          const years = targetYear - baseYear;
          if (years >= 1) {
            results.push({
              kind: "anniversary" as const,
              date: `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(itemDay).padStart(2, "0")}`,
              title: formatRelationshipYearlyTitle(item.name, years),
              category: item.category,
              reminderEnabled: item.reminderEnabled,
              noteSummary: summarizeNote(item.note),
              ruleType: item.ruleType
            });
          }
        }

        return results;
      }

      if (itemMonth !== targetMonth) return [];
      return [
        {
          kind: "anniversary" as const,
          date: `${month}-${String(itemDay).padStart(2, "0")}`,
          title: item.name,
          category: item.category,
          reminderEnabled: item.reminderEnabled,
          noteSummary: summarizeNote(item.note),
          ruleType: item.ruleType
        }
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function validateUpsertInput(input: AnniversaryUpsertInput): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.baseDate)) return "Date must be YYYY-MM-DD.";
  if (input.note.length > 240) return "Note must be 240 characters or less.";
  if (input.reminderOffsetDays < 0 || input.reminderOffsetDays > 365) return "Reminder offset must be 0..365.";
  if (input.ruleType === "monthly" && (input.ruleValue < 1 || input.ruleValue > 12)) return "Monthly rule value must be 1..12.";
  if (input.ruleType === "yearly" && (input.ruleValue < 1 || input.ruleValue > 10)) return "Yearly rule value must be 1..10.";
  if (input.ruleType === "day_offset" && (input.ruleValue < 1 || input.ruleValue > 36500)) return "Day offset value must be 1..36500.";
  return null;
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
  if (res.success) return ok(res.data.map((item) => normalizeRecord(item)));
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") return ok(await getLocalAnniversaries());
  return fail(res.errorCode ?? "INTERNAL_ERROR", [] as AnniversaryRecord[]);
}

export async function createAnniversaryDetailed(role: UserRole | null, input: AnniversaryUpsertInput) {
  const validationError = validateUpsertInput(input);
  if (validationError) return fail("VALIDATION_ERROR", null as AnniversaryRecord | null);
  if (input.category === "birthday" || input.category === "relationship") {
    return fail("ANNIVERSARY_CREATE_LOCKED", null as AnniversaryRecord | null);
  }

  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(
    "/anniversaries",
    "POST",
    auth.role,
    auth.token,
    input as unknown as Record<string, unknown>
  );
  if (res.success) return ok(normalizeRecord(res.data));
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const created = normalizeRecord({
      id: `local-${Date.now().toString(36)}`,
      userId: local[0]?.userId ?? "local-user",
      isActive: true,
      isDeleteLocked: false,
      ...input
    });
    await setLocalAnniversaries([...local, created]);
    return ok(created);
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function updateAnniversaryDetailed(
  role: UserRole | null,
  anniversaryId: string,
  patch: Partial<AnniversaryUpsertInput>
) {
  if (patch.category === "birthday" || patch.category === "relationship") {
    return fail("ANNIVERSARY_CREATE_LOCKED", null as AnniversaryRecord | null);
  }

  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(
    `/anniversaries/${encodeURIComponent(anniversaryId)}`,
    "PATCH",
    auth.role,
    auth.token,
    patch
  );
  if (res.success) return ok(normalizeRecord(res.data));
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const idx = local.findIndex((item) => item.id === anniversaryId);
    if (idx < 0) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
    if (local[idx].isDeleteLocked || local[idx].category === "birthday" || local[idx].category === "relationship") {
      return fail("ANNIVERSARY_EDIT_LOCKED", null as AnniversaryRecord | null);
    }
    const next = [...local];
    next[idx] = normalizeRecord({ ...next[idx], ...patch });
    await setLocalAnniversaries(next);
    return ok(next[idx]);
  }
  return fail(res.errorCode ?? "INTERNAL_ERROR", null as AnniversaryRecord | null);
}

export async function createDefaultAnniversary(role: UserRole | null) {
  return createAnniversaryDetailed(role, {
    name: "New Anniversary",
    baseDate: "2024-03-23",
    category: "anniversary",
    note: "",
    reminderEnabled: false,
    reminderOffsetDays: 0,
    ruleType: "yearly",
    ruleValue: 1
  });
}

export async function renameAnniversary(role: UserRole | null, anniversaryId: string, nextName: string) {
  return updateAnniversaryDetailed(role, anniversaryId, { name: nextName });
}

export async function removeAnniversary(role: UserRole | null, anniversaryId: string) {
  const auth = await getAuthHeaders(role);
  if (!auth) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);

  const res = await callServer<AnniversaryRecord>(`/anniversaries/${encodeURIComponent(anniversaryId)}`, "DELETE", auth.role, auth.token);
  if (res.success) return ok(normalizeRecord(res.data));
  if (res.errorCode === "EXTERNAL_SYNC_FAILED") {
    const local = await getLocalAnniversaries();
    const target = local.find((item) => item.id === anniversaryId) ?? null;
    if (!target) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
    if (target.isDeleteLocked || target.category === "birthday" || target.category === "relationship") {
      return fail("ANNIVERSARY_DELETE_LOCKED", null as AnniversaryRecord | null);
    }
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
    case "ANNIVERSARY_CREATE_LOCKED":
      return "생일과 사귄날은 생성할 수 없습니다.";
    case "ANNIVERSARY_NOT_FOUND":
      return "기념일을 찾을 수 없습니다.";
    case "ANNIVERSARY_EDIT_LOCKED":
      return "기본 기념일은 수정할 수 없습니다.";
    case "ANNIVERSARY_DELETE_LOCKED":
      return "기본 기념일은 삭제할 수 없습니다.";
    case "FORBIDDEN_OWNER":
      return "본인 항목만 수정/삭제할 수 있습니다.";
    case "FORBIDDEN_ROLE":
      return "권한이 없습니다.";
    case "EXTERNAL_SYNC_FAILED":
      return "서버 연결에 실패해 로컬 데이터로 표시합니다.";
    default:
      return "예상하지 못한 오류가 발생했습니다.";
  }
}


