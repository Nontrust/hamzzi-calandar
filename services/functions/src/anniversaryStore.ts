import { Pool } from "pg";
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

type AnniversaryRow = {
  id: string;
  user_id: string;
  name: string;
  base_date: string;
  rule_type: AnniversaryRuleType;
  rule_value: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

const memoryStore = new Map<string, AnniversaryRecord>();
const seededUsers = new Set<string>();
const pgConnectionString = process.env.PG_CONNECTION_STRING ?? process.env.DATABASE_URL ?? "";
let pgPool: Pool | null = null;

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
    throw new AnniversaryError("VALIDATION_ERROR", "month must use YYYY-MM format.");
  }
  return month;
}

function hasPg(): boolean {
  return pgConnectionString.trim().length > 0;
}

function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: pgConnectionString
    });
  }
  return pgPool;
}

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toRecord(row: AnniversaryRow): AnniversaryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    baseDate: row.base_date,
    ruleType: row.rule_type,
    ruleValue: row.rule_value,
    isActive: row.is_active,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

export function clearAnniversaryStore(): void {
  memoryStore.clear();
  seededUsers.clear();
}

async function seedDefaultAnniversariesForUser(userId: string, now = new Date()): Promise<void> {
  if (seededUsers.has(userId)) return;

  const defaults: Array<Pick<AnniversaryRecord, "name" | "baseDate" | "ruleType" | "ruleValue">> = [
    { name: "햄찌 생일", baseDate: "2024-01-08", ruleType: "yearly", ruleValue: 1 },
    { name: "기념일", baseDate: "2024-03-23", ruleType: "yearly", ruleValue: 1 },
    { name: "내 생일", baseDate: "2024-08-04", ruleType: "yearly", ruleValue: 1 }
  ];

  if (hasPg()) {
    const pool = getPgPool();
    for (const item of defaults) {
      await pool.query(
        `
          insert into public.anniversaries (user_id, name, base_date, rule_type, rule_value, is_active, created_at, updated_at)
          select $1, $2, $3::date, $4, $5, true, $6::timestamptz, $6::timestamptz
          where not exists (
            select 1
            from public.anniversaries
            where user_id = $1 and name = $2 and base_date = $3::date and is_active = true
          )
        `,
        [userId, item.name, item.baseDate, item.ruleType, item.ruleValue, now.toISOString()]
      );
    }
    seededUsers.add(userId);
    return;
  }

  for (const item of defaults) {
    const exists = [...memoryStore.values()].some(
      (record) => record.userId === userId && record.name === item.name && record.baseDate === item.baseDate && record.isActive
    );
    if (exists) continue;
    await createAnniversary(userId, item, now);
  }
  seededUsers.add(userId);
}

export async function createAnniversary(userId: string, input: CreateAnniversaryInput, now = new Date()): Promise<AnniversaryRecord> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnniversaryError("VALIDATION_ERROR", "Anniversary input is invalid.");
  }

  if (hasPg()) {
    const pool = getPgPool();
    const result = await pool.query<AnniversaryRow>(
      `
        insert into public.anniversaries (user_id, name, base_date, rule_type, rule_value, is_active, created_at, updated_at)
        values ($1, $2, $3::date, $4, $5, $6, $7::timestamptz, $7::timestamptz)
        returning
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          rule_type,
          rule_value,
          is_active,
          created_at,
          updated_at
      `,
      [
        userId,
        parsed.data.name,
        parsed.data.baseDate,
        parsed.data.ruleType,
        parsed.data.ruleValue,
        parsed.data.isActive ?? true,
        now.toISOString()
      ]
    );
    return toRecord(result.rows[0]);
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
  memoryStore.set(record.id, record);
  return record;
}

export async function listAnniversaries(userId: string): Promise<AnniversaryRecord[]> {
  await seedDefaultAnniversariesForUser(userId);

  if (hasPg()) {
    const pool = getPgPool();
    const result = await pool.query<AnniversaryRow>(
      `
        select
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          rule_type,
          rule_value,
          is_active,
          created_at,
          updated_at
        from public.anniversaries
        where user_id = $1 and is_active = true
        order by base_date asc, name asc
      `,
      [userId]
    );
    return result.rows.map(toRecord);
  }

  return [...memoryStore.values()]
    .filter((item) => item.userId === userId && item.isActive)
    .sort((a, b) => a.baseDate.localeCompare(b.baseDate));
}

export async function updateAnniversary(
  userId: string,
  anniversaryId: string,
  input: UpdateAnniversaryInput,
  now = new Date()
): Promise<AnniversaryRecord> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnniversaryError("VALIDATION_ERROR", "Anniversary update input is invalid.");
  }

  if (hasPg()) {
    const pool = getPgPool();
    const foundResult = await pool.query<{ user_id: string; is_active: boolean }>(
      "select user_id, is_active from public.anniversaries where id = $1",
      [anniversaryId]
    );
    const found = foundResult.rows[0];
    if (!found || !found.is_active) {
      throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
    }
    if (found.user_id !== userId) {
      throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can update this anniversary.");
    }

    const result = await pool.query<AnniversaryRow>(
      `
        update public.anniversaries
        set
          name = coalesce($2, name),
          base_date = coalesce($3::date, base_date),
          rule_type = coalesce($4, rule_type),
          rule_value = coalesce($5, rule_value),
          is_active = coalesce($6, is_active),
          updated_at = $7::timestamptz
        where id = $1
        returning
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          rule_type,
          rule_value,
          is_active,
          created_at,
          updated_at
      `,
      [
        anniversaryId,
        parsed.data.name ?? null,
        parsed.data.baseDate ?? null,
        parsed.data.ruleType ?? null,
        parsed.data.ruleValue ?? null,
        parsed.data.isActive ?? null,
        now.toISOString()
      ]
    );
    return toRecord(result.rows[0]);
  }

  const found = memoryStore.get(anniversaryId);
  if (!found || !found.isActive) {
    throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
  }
  if (found.userId !== userId) {
    throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can update this anniversary.");
  }
  const next: AnniversaryRecord = {
    ...found,
    ...parsed.data,
    updatedAt: now.toISOString()
  };
  memoryStore.set(next.id, next);
  return next;
}

export async function deleteAnniversary(userId: string, anniversaryId: string, now = new Date()): Promise<AnniversaryRecord> {
  if (hasPg()) {
    const pool = getPgPool();
    const foundResult = await pool.query<{ user_id: string; is_active: boolean }>(
      "select user_id, is_active from public.anniversaries where id = $1",
      [anniversaryId]
    );
    const found = foundResult.rows[0];
    if (!found || !found.is_active) {
      throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
    }
    if (found.user_id !== userId) {
      throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can delete this anniversary.");
    }

    const result = await pool.query<AnniversaryRow>(
      `
        update public.anniversaries
        set is_active = false, updated_at = $2::timestamptz
        where id = $1
        returning
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          rule_type,
          rule_value,
          is_active,
          created_at,
          updated_at
      `,
      [anniversaryId, now.toISOString()]
    );
    return toRecord(result.rows[0]);
  }

  const found = memoryStore.get(anniversaryId);
  if (!found || !found.isActive) {
    throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
  }
  if (found.userId !== userId) {
    throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can delete this anniversary.");
  }
  const next: AnniversaryRecord = {
    ...found,
    isActive: false,
    updatedAt: now.toISOString()
  };
  memoryStore.set(next.id, next);
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

export async function buildAnniversaryMonthItems(userId: string, month: string): Promise<CalendarMonthItem[]> {
  const monthPrefix = toMonthPrefix(month);
  const records = await listAnniversaries(userId);
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
