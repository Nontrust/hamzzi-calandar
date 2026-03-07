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

const ANNIVERSARY_KEY = "anniversary-server-v1";

async function actorFromRole(role: UserRole | null): Promise<{ userId: string; role: UserRole } | null> {
  if (!role) return null;
  const auth = await requireSession();
  if (!auth.success) return null;
  return { userId: auth.session.user.userId, role };
}

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, errorCode: null };
}

function fail<T>(errorCode: ErrorCode, fallback: T): ApiResponse<T> {
  return { success: false, data: fallback, errorCode };
}

async function readStore(): Promise<AnniversaryRecord[]> {
  const raw = await AsyncStorage.getItem(ANNIVERSARY_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as AnniversaryRecord[];
}

async function writeStore(data: AnniversaryRecord[]): Promise<void> {
  await AsyncStorage.setItem(ANNIVERSARY_KEY, JSON.stringify(data));
}

function resolveAnniversaryDate(record: AnniversaryRecord, month: string): string | null {
  const [year, mm] = month.split("-").map(Number);
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  if (record.ruleType === "yearly") {
    const monthNum = base.getUTCMonth() + 1;
    if (monthNum !== mm) return null;
    const day = Math.min(base.getUTCDate(), new Date(Date.UTC(year, mm, 0)).getUTCDate());
    return `${month}-${`${day}`.padStart(2, "0")}`;
  }
  if (record.ruleType === "monthly") {
    const day = Math.min(base.getUTCDate(), new Date(Date.UTC(year, mm, 0)).getUTCDate());
    return `${month}-${`${day}`.padStart(2, "0")}`;
  }
  const target = new Date(base.getTime() + (record.ruleValue - 1) * 24 * 60 * 60 * 1000);
  const y = target.getUTCFullYear();
  const m = `${target.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${target.getUTCDate()}`.padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  return date.startsWith(`${month}-`) ? date : null;
}

function titleWithDday(record: AnniversaryRecord, date: string): string {
  const baseMs = new Date(`${record.baseDate}T00:00:00.000Z`).getTime();
  const dateMs = new Date(`${date}T00:00:00.000Z`).getTime();
  const d = Math.floor((dateMs - baseMs) / (24 * 60 * 60 * 1000)) + 1;
  return `${record.name} D+${Math.max(1, d)}`;
}

export async function fetchCalendarMonth(role: UserRole | null, month: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", { month, items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }> });
  try {
    const list = await readStore();
    const mine = list.filter((item) => item.userId === actor.userId && item.isActive);
    const anniversaries = mine
      .map((item) => {
        const date = resolveAnniversaryDate(item, month);
        if (!date) return null;
        return { kind: "anniversary" as const, date, title: titleWithDday(item, date) };
      })
      .filter((item): item is { kind: "anniversary"; date: string; title: string } => Boolean(item));

    const items = [{ kind: "exam" as const, date: `${month}-12`, title: "Exam schedule placeholder" }, ...anniversaries].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return ok({ month, items });
  } catch {
    return fail("EXTERNAL_SYNC_FAILED", { month, items: [] as Array<{ kind: "exam" | "anniversary"; date: string; title: string }> });
  }
}

export async function fetchAnniversaries(role: UserRole | null) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", [] as AnniversaryRecord[]);
  const list = await readStore();
  return ok(list.filter((item) => item.userId === actor.userId && item.isActive));
}

export async function createDefaultAnniversary(role: UserRole | null) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);
  const next: AnniversaryRecord = {
    id: `anv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: actor.userId,
    name: "First Day",
    baseDate: "2024-03-23",
    ruleType: "yearly",
    ruleValue: 1,
    isActive: true
  };
  const list = await readStore();
  list.push(next);
  await writeStore(list);
  return ok(next);
}

export async function renameAnniversary(role: UserRole | null, anniversaryId: string, nextName: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);
  if (!nextName.trim()) return fail("VALIDATION_ERROR", null as AnniversaryRecord | null);
  const list = await readStore();
  const idx = list.findIndex((item) => item.id === anniversaryId && item.isActive);
  if (idx < 0) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
  if (list[idx].userId !== actor.userId) return fail("FORBIDDEN_OWNER", null as AnniversaryRecord | null);
  list[idx] = { ...list[idx], name: nextName };
  await writeStore(list);
  return ok(list[idx]);
}

export async function removeAnniversary(role: UserRole | null, anniversaryId: string) {
  const actor = await actorFromRole(role);
  if (!actor) return fail("AUTH_REQUIRED", null as AnniversaryRecord | null);
  const list = await readStore();
  const idx = list.findIndex((item) => item.id === anniversaryId && item.isActive);
  if (idx < 0) return fail("ANNIVERSARY_NOT_FOUND", null as AnniversaryRecord | null);
  if (list[idx].userId !== actor.userId) return fail("FORBIDDEN_OWNER", null as AnniversaryRecord | null);
  list[idx] = { ...list[idx], isActive: false };
  await writeStore(list);
  return ok(list[idx]);
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
    case "EXTERNAL_SYNC_FAILED":
      return "External calendar sync failed. Try again later.";
    default:
      return "Unexpected server error.";
  }
}
