import { z } from "zod";

export type AnniversaryRuleType = "day_offset" | "monthly" | "yearly";
export type AnniversaryAuditAction =
  | "anniversary.create"
  | "anniversary.update"
  | "anniversary.delete"
  | "anniversary.list"
  | "anniversary.month_view";

export interface AnniversaryRecord {
  id: string;
  userId: string;
  name: string;
  baseDate: string;
  ruleType: AnniversaryRuleType;
  ruleValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarMonthItem {
  kind: "exam" | "anniversary";
  date: string;
  title: string;
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
  baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ruleType: z.enum(["day_offset", "monthly", "yearly"]),
  ruleValue: z.number().int().positive(),
  isActive: z.boolean().optional()
});

const updateSchema = createSchema.partial();

export type CreateAnniversaryInput = z.infer<typeof createSchema>;
export type UpdateAnniversaryInput = z.infer<typeof updateSchema>;

export class AnniversaryError extends Error {
  constructor(
    public readonly code: "VALIDATION_ERROR" | "ANNIVERSARY_NOT_FOUND" | "FORBIDDEN_OWNER",
    message: string
  ) {
    super(message);
  }
}

const store = new Map<string, AnniversaryRecord>();

function makeId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `anv_${t}_${r}`;
}

function dayDiff(from: string, to: string): number {
  const f = new Date(`${from}T00:00:00.000Z`).getTime();
  const t = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.floor((t - f) / (24 * 60 * 60 * 1000));
}

function formatAnniversaryTitle(name: string, baseDate: string, targetDate: string): string {
  const d = dayDiff(baseDate, targetDate) + 1;
  return `${name} · D+${Math.max(1, d)}`;
}

function toMonthPrefix(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new AnniversaryError("VALIDATION_ERROR", "month는 YYYY-MM 형식이어야 합니다.");
  }
  return month;
}

export function clearAnniversaryStore(): void {
  store.clear();
}

export function createAnniversary(userId: string, input: CreateAnniversaryInput, now = new Date()): AnniversaryRecord {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnniversaryError("VALIDATION_ERROR", "기념일 입력값이 올바르지 않습니다.");
  }
  const record: AnniversaryRecord = {
    id: makeId(),
    userId,
    name: parsed.data.name,
    baseDate: parsed.data.baseDate,
    ruleType: parsed.data.ruleType,
    ruleValue: parsed.data.ruleValue,
    isActive: parsed.data.isActive ?? true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  store.set(record.id, record);
  return record;
}

export function listAnniversaries(userId: string): AnniversaryRecord[] {
  return [...store.values()]
    .filter((item) => item.userId === userId && item.isActive)
    .sort((a, b) => a.baseDate.localeCompare(b.baseDate));
}

export function updateAnniversary(
  userId: string,
  anniversaryId: string,
  input: UpdateAnniversaryInput,
  now = new Date()
): AnniversaryRecord {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnniversaryError("VALIDATION_ERROR", "기념일 수정값이 올바르지 않습니다.");
  }
  const found = store.get(anniversaryId);
  if (!found || !found.isActive) {
    throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "기념일을 찾을 수 없습니다.");
  }
  if (found.userId !== userId) {
    throw new AnniversaryError("FORBIDDEN_OWNER", "본인 기념일만 수정할 수 있습니다.");
  }
  const next: AnniversaryRecord = {
    ...found,
    ...parsed.data,
    updatedAt: now.toISOString()
  };
  store.set(next.id, next);
  return next;
}

export function deleteAnniversary(userId: string, anniversaryId: string, now = new Date()): AnniversaryRecord {
  const found = store.get(anniversaryId);
  if (!found || !found.isActive) {
    throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "기념일을 찾을 수 없습니다.");
  }
  if (found.userId !== userId) {
    throw new AnniversaryError("FORBIDDEN_OWNER", "본인 기념일만 삭제할 수 있습니다.");
  }
  const next: AnniversaryRecord = {
    ...found,
    isActive: false,
    updatedAt: now.toISOString()
  };
  store.set(next.id, next);
  return next;
}

function monthlyProjection(record: AnniversaryRecord, monthPrefix: string): string[] {
  const [y, m] = monthPrefix.split("-").map(Number);
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  const day = base.getUTCDate();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const targetDay = Math.min(day, daysInMonth);
  return [`${monthPrefix}-${`${targetDay}`.padStart(2, "0")}`];
}

function yearlyProjection(record: AnniversaryRecord, monthPrefix: string): string[] {
  const [targetY, targetM] = monthPrefix.split("-").map(Number);
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  const month = base.getUTCMonth() + 1;
  if (month !== targetM) {
    return [];
  }
  const day = base.getUTCDate();
  const daysInMonth = new Date(Date.UTC(targetY, targetM, 0)).getUTCDate();
  const targetDay = Math.min(day, daysInMonth);
  return [`${monthPrefix}-${`${targetDay}`.padStart(2, "0")}`];
}

function dayOffsetProjection(record: AnniversaryRecord, monthPrefix: string): string[] {
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  const target = new Date(base.getTime() + (record.ruleValue - 1) * 24 * 60 * 60 * 1000);
  const y = target.getUTCFullYear();
  const m = `${target.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${target.getUTCDate()}`.padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  return date.startsWith(`${monthPrefix}-`) ? [date] : [];
}

export function buildAnniversaryMonthItems(userId: string, month: string): CalendarMonthItem[] {
  const monthPrefix = toMonthPrefix(month);
  const records = listAnniversaries(userId);
  const items: CalendarMonthItem[] = [];

  for (const record of records) {
    const dates =
      record.ruleType === "day_offset"
        ? dayOffsetProjection(record, monthPrefix)
        : record.ruleType === "monthly"
          ? monthlyProjection(record, monthPrefix)
          : yearlyProjection(record, monthPrefix);

    for (const date of dates) {
      items.push({
        kind: "anniversary",
        date,
        title: formatAnniversaryTitle(record.name, record.baseDate, date)
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
