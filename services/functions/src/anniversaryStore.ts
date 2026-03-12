import { Pool } from "pg";
import { z } from "zod";

export type AnniversaryRuleType = "day_offset" | "monthly" | "yearly";
export type AnniversaryCategory = "birthday" | "relationship" | "anniversary" | "other";
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
  category: AnniversaryCategory;
  note: string;
  reminderEnabled: boolean;
  reminderOffsetDays: number;
  ruleType: AnniversaryRuleType;
  ruleValue: number;
  isActive: boolean;
  isDeleteLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarMonthItem {
  kind: "exam" | "anniversary";
  date: string;
  title: string;
  category?: AnniversaryCategory;
  reminderEnabled?: boolean;
  noteSummary?: string;
  ruleType?: AnniversaryRuleType;
}

const createSchema = z
  .object({
    name: z.string().min(1).max(60),
    baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(["birthday", "relationship", "anniversary", "other"]).optional(),
    note: z.string().max(240).optional(),
    reminderEnabled: z.boolean().optional(),
    reminderOffsetDays: z.number().int().min(0).max(365).optional(),
    ruleType: z.enum(["day_offset", "monthly", "yearly"]),
    ruleValue: z.number().int().positive(),
    isActive: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (value.ruleType === "monthly" && (value.ruleValue < 1 || value.ruleValue > 12)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "monthly ruleValue must be 1..12" });
    }
    if (value.ruleType === "yearly" && (value.ruleValue < 1 || value.ruleValue > 10)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "yearly ruleValue must be 1..10" });
    }
    if (value.ruleType === "day_offset" && (value.ruleValue < 1 || value.ruleValue > 36500)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "day_offset ruleValue must be 1..36500" });
    }
    if (value.reminderEnabled && value.reminderOffsetDays === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["reminderOffsetDays"],
        message: "reminderOffsetDays is required when reminderEnabled=true"
      });
    }
  });

const updateSchema = z
  .object({
    name: z.string().min(1).max(60).optional(),
    baseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category: z.enum(["birthday", "relationship", "anniversary", "other"]).optional(),
    note: z.string().max(240).optional(),
    reminderEnabled: z.boolean().optional(),
    reminderOffsetDays: z.number().int().min(0).max(365).optional(),
    ruleType: z.enum(["day_offset", "monthly", "yearly"]).optional(),
    ruleValue: z.number().int().positive().optional(),
    isActive: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (value.ruleType === "monthly" && value.ruleValue !== undefined && (value.ruleValue < 1 || value.ruleValue > 12)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "monthly ruleValue must be 1..12" });
    }
    if (value.ruleType === "yearly" && value.ruleValue !== undefined && (value.ruleValue < 1 || value.ruleValue > 10)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "yearly ruleValue must be 1..10" });
    }
    if (value.ruleType === "day_offset" && value.ruleValue !== undefined && (value.ruleValue < 1 || value.ruleValue > 36500)) {
      ctx.addIssue({ code: "custom", path: ["ruleValue"], message: "day_offset ruleValue must be 1..36500" });
    }
  });

export type CreateAnniversaryInput = z.infer<typeof createSchema>;
export type UpdateAnniversaryInput = z.infer<typeof updateSchema>;

export class AnniversaryError extends Error {
  constructor(
    public readonly code:
      | "VALIDATION_ERROR"
      | "ANNIVERSARY_NOT_FOUND"
      | "FORBIDDEN_OWNER"
      | "ANNIVERSARY_DELETE_LOCKED"
      | "ANNIVERSARY_EDIT_LOCKED"
      | "ANNIVERSARY_CREATE_LOCKED",
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
  category: AnniversaryCategory;
  note: string;
  reminder_enabled: boolean;
  reminder_offset_days: number;
  rule_type: AnniversaryRuleType;
  rule_value: number;
  is_active: boolean;
  is_delete_locked: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type SeedAnniversary = {
  name: string;
  baseDate: string;
  category: AnniversaryCategory;
  note: string;
  reminderEnabled: boolean;
  reminderOffsetDays: number;
  ruleType: AnniversaryRuleType;
  ruleValue: number;
  isDeleteLocked: boolean;
};

const memoryStore = new Map<string, AnniversaryRecord>();
const seededUsers = new Set<string>();
const pgConnectionString = process.env.PG_CONNECTION_STRING ?? process.env.DATABASE_URL ?? "";
let pgPool: Pool | null = null;

function makeId(): string {
  return `anv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

function formatRelationshipMilestoneTitle(name: string, dayCount: number): string {
  return `${name} ${dayCount}일`;
}

function formatRelationshipYearlyTitle(name: string, years: number): string {
  return `${name} ${years}주년`;
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
    pgPool = new Pool({ connectionString: pgConnectionString });
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
    category: row.category,
    note: row.note,
    reminderEnabled: row.reminder_enabled,
    reminderOffsetDays: row.reminder_offset_days,
    ruleType: row.rule_type,
    ruleValue: row.rule_value,
    isActive: row.is_active,
    isDeleteLocked: row.is_delete_locked,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

function normalizeCreateInput(input: CreateAnniversaryInput): CreateAnniversaryInput {
  return {
    ...input,
    category: input.category ?? "anniversary",
    note: input.note ?? "",
    reminderEnabled: input.reminderEnabled ?? false,
    reminderOffsetDays: input.reminderOffsetDays ?? 0,
    isActive: input.isActive ?? true
  };
}

function summarizeNote(note: string): string {
  const trimmed = note.trim();
  if (!trimmed) return "";
  return trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
}

function isEditLockedRecord(record: Pick<AnniversaryRecord, "category" | "isDeleteLocked">): boolean {
  return record.isDeleteLocked || record.category === "birthday" || record.category === "relationship";
}

function getVisibleUserIds(userId: string): string[] {
  if (userId === "user-a" || userId === "user-b") {
    return ["user-a", "user-b"];
  }
  return [userId];
}

function isSharedCategory(category: AnniversaryCategory): boolean {
  return category === "birthday" || category === "relationship";
}

function isManagedCategory(category: AnniversaryCategory): boolean {
  return category === "birthday" || category === "relationship";
}

export function clearAnniversaryStore(): void {
  memoryStore.clear();
  seededUsers.clear();
}

function getDefaultAnniversariesForUser(userId: string): SeedAnniversary[] {
  if (userId === "user-a") {
    return [
      {
        name: "내 생일",
        baseDate: "1995-08-04",
        category: "birthday",
        note: "",
        reminderEnabled: true,
        reminderOffsetDays: 5,
        ruleType: "yearly",
        ruleValue: 1,
        isDeleteLocked: true
      },
      {
        name: "햄찌 생일",
        baseDate: "1998-01-08",
        category: "birthday",
        note: "",
        reminderEnabled: true,
        reminderOffsetDays: 3,
        ruleType: "yearly",
        ruleValue: 1,
        isDeleteLocked: true
      }
    ];
  }

  if (userId === "user-b") {
    return [
      {
        name: "나함찌 생일",
        baseDate: "1995-08-04",
        category: "birthday",
        note: "",
        reminderEnabled: true,
        reminderOffsetDays: 5,
        ruleType: "yearly",
        ruleValue: 1,
        isDeleteLocked: true
      },
      {
        name: "내 생일",
        baseDate: "1998-01-08",
        category: "birthday",
        note: "",
        reminderEnabled: true,
        reminderOffsetDays: 3,
        ruleType: "yearly",
        ruleValue: 1,
        isDeleteLocked: true
      }
    ];
  }

  return [
    {
      name: "나함찌 생일",
      baseDate: "1995-08-04",
      category: "birthday",
      note: "",
      reminderEnabled: true,
      reminderOffsetDays: 5,
      ruleType: "yearly",
      ruleValue: 1,
      isDeleteLocked: true
    },
    {
      name: "햄찌 생일",
      baseDate: "1998-01-08",
      category: "birthday",
      note: "",
      reminderEnabled: true,
      reminderOffsetDays: 3,
      ruleType: "yearly",
      ruleValue: 1,
      isDeleteLocked: true
    }
  ];
}

async function seedDefaultAnniversariesForUser(userId: string, now = new Date()): Promise<void> {
  if (seededUsers.has(userId)) return;

  const defaults = getDefaultAnniversariesForUser(userId);

  if (hasPg()) {
    const pool = getPgPool();
    await pool.query(
      `
        update public.anniversaries
        set is_active = false, updated_at = $2::timestamptz
        where user_id = $1
          and is_active = true
          and coalesce(is_delete_locked, false) = false
          and ((name = 'Hamzzi Birthday' and base_date = '2024-01-08'::date)
            or (name = 'Anniversary Day' and base_date = '2024-03-23'::date)
            or (name = 'My Birthday' and base_date = '2024-08-04'::date))
      `,
      [userId, now.toISOString()]
    );
    for (const item of defaults) {
      await pool.query(
        `
          insert into public.anniversaries (
            user_id, name, base_date, category, note, reminder_enabled, reminder_offset_days, rule_type, rule_value, is_active, is_delete_locked, created_at, updated_at
          )
          select
            $1, $2, $3::date, $4, $5, $6, $7, $8, $9, true, $10, $11::timestamptz, $11::timestamptz
          where not exists (
            select 1
            from public.anniversaries
            where user_id = $1
              and name = $2
              and base_date = $3::date
              and is_active = true
          )
        `,
        [
          userId,
          item.name,
          item.baseDate,
          item.category,
          item.note,
          item.reminderEnabled,
          item.reminderOffsetDays,
          item.ruleType,
          item.ruleValue,
          item.isDeleteLocked,
          now.toISOString()
        ]
      );
    }
    seededUsers.add(userId);
    return;
  }

  for (const item of defaults) {
    const exists = [...memoryStore.values()].some(
      (record) => record.userId === userId && record.name === item.name && record.baseDate === item.baseDate && record.isActive
    );
    if (!exists) {
      const created = await createAnniversary(userId, { ...item }, now, { allowManagedCategories: true });
      memoryStore.set(created.id, { ...created, isDeleteLocked: item.isDeleteLocked });
    }
  }
  seededUsers.add(userId);
}

export async function createAnniversary(
  userId: string,
  input: CreateAnniversaryInput,
  now = new Date(),
  options: { allowManagedCategories?: boolean } = {}
): Promise<AnniversaryRecord> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new AnniversaryError("VALIDATION_ERROR", "Anniversary input is invalid.");
  }
  const normalized = normalizeCreateInput(parsed.data);
  if (!options.allowManagedCategories && isManagedCategory(normalized.category ?? "anniversary")) {
    throw new AnniversaryError("ANNIVERSARY_CREATE_LOCKED", "This anniversary category cannot be created manually.");
  }
  const targetUserIds = isSharedCategory(normalized.category ?? "anniversary") ? getVisibleUserIds(userId) : [userId];

  if (hasPg()) {
    const pool = getPgPool();
    let createdForActor: AnniversaryRecord | null = null;
    for (const targetUserId of targetUserIds) {
      const result = await pool.query<AnniversaryRow>(
        `
          insert into public.anniversaries (
            user_id, name, base_date, category, note, reminder_enabled, reminder_offset_days, rule_type, rule_value, is_active, is_delete_locked, created_at, updated_at
          )
          values ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, false, $11::timestamptz, $11::timestamptz)
          returning
            id,
            user_id,
            name,
            to_char(base_date, 'YYYY-MM-DD') as base_date,
            category,
            note,
            reminder_enabled,
            reminder_offset_days,
            rule_type,
            rule_value,
            is_active,
            is_delete_locked,
            created_at,
            updated_at
        `,
        [
          targetUserId,
          normalized.name,
          normalized.baseDate,
          normalized.category,
          normalized.note,
          normalized.reminderEnabled,
          normalized.reminderOffsetDays,
          normalized.ruleType,
          normalized.ruleValue,
          normalized.isActive ?? true,
          now.toISOString()
        ]
      );
      if (targetUserId === userId) {
        createdForActor = toRecord(result.rows[0]);
      }
    }
    return createdForActor!;
  }

  let createdForActor: AnniversaryRecord | null = null;
  for (const targetUserId of targetUserIds) {
    const record: AnniversaryRecord = {
      id: makeId(),
      userId: targetUserId,
      name: normalized.name,
      baseDate: normalized.baseDate,
      category: normalized.category ?? "anniversary",
      note: normalized.note ?? "",
      reminderEnabled: normalized.reminderEnabled ?? false,
      reminderOffsetDays: normalized.reminderOffsetDays ?? 0,
      ruleType: normalized.ruleType,
      ruleValue: normalized.ruleValue,
      isActive: normalized.isActive ?? true,
      isDeleteLocked: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    memoryStore.set(record.id, record);
    if (targetUserId === userId) createdForActor = record;
  }
  return createdForActor!;
}

export async function listAnniversaries(userId: string): Promise<AnniversaryRecord[]> {
  const visibleUserIds = getVisibleUserIds(userId);
  for (const visibleUserId of visibleUserIds) {
    await seedDefaultAnniversariesForUser(visibleUserId);
  }

  if (hasPg()) {
    const pool = getPgPool();
    const result = await pool.query<AnniversaryRow>(
      `
        select
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          category,
          note,
          reminder_enabled,
          reminder_offset_days,
          rule_type,
          rule_value,
          is_active,
          is_delete_locked,
          created_at,
          updated_at
        from public.anniversaries
        where user_id = any($1::text[]) and is_active = true
        order by base_date asc, name asc, user_id asc
      `,
      [visibleUserIds]
    );
    return result.rows.map(toRecord);
  }

  return [...memoryStore.values()]
    .filter((item) => visibleUserIds.includes(item.userId) && item.isActive)
    .sort((a, b) => a.baseDate.localeCompare(b.baseDate) || a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId));
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
  if (parsed.data.category && isManagedCategory(parsed.data.category)) {
    throw new AnniversaryError("ANNIVERSARY_CREATE_LOCKED", "This anniversary category cannot be created manually.");
  }

  if (hasPg()) {
    const pool = getPgPool();
    const foundResult = await pool.query<{ user_id: string; is_active: boolean; is_delete_locked: boolean; category: AnniversaryCategory }>(
      "select user_id, is_active, coalesce(is_delete_locked, false) as is_delete_locked, category from public.anniversaries where id = $1",
      [anniversaryId]
    );
    const found = foundResult.rows[0];
    if (!found || !found.is_active) {
      throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
    }
    if (found.user_id !== userId) {
      throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can update this anniversary.");
    }
    if (found.is_delete_locked || found.category === "birthday" || found.category === "relationship") {
      throw new AnniversaryError("ANNIVERSARY_EDIT_LOCKED", "This anniversary cannot be edited.");
    }

    const result = await pool.query<AnniversaryRow>(
      `
        update public.anniversaries
        set
          name = coalesce($2, name),
          base_date = coalesce($3::date, base_date),
          category = coalesce($4, category),
          note = coalesce($5, note),
          reminder_enabled = coalesce($6, reminder_enabled),
          reminder_offset_days = coalesce($7, reminder_offset_days),
          rule_type = coalesce($8, rule_type),
          rule_value = coalesce($9, rule_value),
          is_active = coalesce($10, is_active),
          updated_at = $11::timestamptz
        where id = $1
        returning
          id,
          user_id,
          name,
          to_char(base_date, 'YYYY-MM-DD') as base_date,
          category,
          note,
          reminder_enabled,
          reminder_offset_days,
          rule_type,
          rule_value,
          is_active,
          is_delete_locked,
          created_at,
          updated_at
      `,
      [
        anniversaryId,
        parsed.data.name ?? null,
        parsed.data.baseDate ?? null,
        parsed.data.category ?? null,
        parsed.data.note ?? null,
        parsed.data.reminderEnabled ?? null,
        parsed.data.reminderOffsetDays ?? null,
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
  if (isEditLockedRecord(found)) {
    throw new AnniversaryError("ANNIVERSARY_EDIT_LOCKED", "This anniversary cannot be edited.");
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
    const foundResult = await pool.query<{ user_id: string; is_active: boolean; is_delete_locked: boolean; name: string; base_date: string; category: AnniversaryCategory }>(
      "select user_id, is_active, coalesce(is_delete_locked, false) as is_delete_locked, name, to_char(base_date, 'YYYY-MM-DD') as base_date, category from public.anniversaries where id = $1",
      [anniversaryId]
    );
    const found = foundResult.rows[0];
    if (!found || !found.is_active) {
      throw new AnniversaryError("ANNIVERSARY_NOT_FOUND", "Anniversary not found.");
    }
    if (found.user_id !== userId) {
      throw new AnniversaryError("FORBIDDEN_OWNER", "Only owner can delete this anniversary.");
    }
    if (found.is_delete_locked || isManagedCategory(found.category)) {
      throw new AnniversaryError("ANNIVERSARY_DELETE_LOCKED", "This anniversary cannot be deleted.");
    }

    if (isSharedCategory(found.category)) {
      const result = await pool.query<AnniversaryRow>(
        `
          update public.anniversaries
          set is_active = false, updated_at = $4::timestamptz
          where user_id = any($1::text[])
            and name = $2
            and base_date = $3::date
            and is_active = true
          returning
            id,
            user_id,
            name,
            to_char(base_date, 'YYYY-MM-DD') as base_date,
            category,
            note,
            reminder_enabled,
            reminder_offset_days,
            rule_type,
            rule_value,
            is_active,
            is_delete_locked,
            created_at,
            updated_at
        `,
        [getVisibleUserIds(userId), found.name, found.base_date, now.toISOString()]
      );
      return toRecord(result.rows.find((row) => row.user_id === userId) ?? result.rows[0]);
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
          category,
          note,
          reminder_enabled,
          reminder_offset_days,
          rule_type,
          rule_value,
          is_active,
          is_delete_locked,
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
  if (found.isDeleteLocked || isManagedCategory(found.category)) {
    throw new AnniversaryError("ANNIVERSARY_DELETE_LOCKED", "This anniversary cannot be deleted.");
  }
  if (isSharedCategory(found.category)) {
    const visibleUserIds = getVisibleUserIds(userId);
    for (const record of [...memoryStore.values()]) {
      if (
        visibleUserIds.includes(record.userId) &&
        record.name === found.name &&
        record.baseDate === found.baseDate &&
        record.category === found.category &&
        record.isActive
      ) {
        memoryStore.set(record.id, { ...record, isActive: false, updatedAt: now.toISOString() });
      }
    }
    const next = { ...found, isActive: false, updatedAt: now.toISOString() };
    memoryStore.set(next.id, next);
    return next;
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
  if (month !== targetM) return [];
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

function relationshipHundredDayProjections(record: AnniversaryRecord, monthPrefix: string): Array<{ date: string; dayCount: number }> {
  const [year, month] = monthPrefix.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  const results: Array<{ date: string; dayCount: number }> = [];

  for (let dayCount = 100; dayCount <= 50000; dayCount += 100) {
    const target = new Date(base.getTime() + (dayCount - 1) * 24 * 60 * 60 * 1000);
    if (target < monthStart) continue;
    if (target > monthEnd) break;

    const y = target.getUTCFullYear();
    const m = `${target.getUTCMonth() + 1}`.padStart(2, "0");
    const d = `${target.getUTCDate()}`.padStart(2, "0");
    results.push({ date: `${y}-${m}-${d}`, dayCount });
  }

  return results;
}

function relationshipYearlyProjection(record: AnniversaryRecord, monthPrefix: string): { date: string; years: number } | null {
  const [targetY, targetM] = monthPrefix.split("-").map(Number);
  const base = new Date(`${record.baseDate}T00:00:00.000Z`);
  const baseMonth = base.getUTCMonth() + 1;
  if (baseMonth !== targetM) return null;

  const day = base.getUTCDate();
  const daysInMonth = new Date(Date.UTC(targetY, targetM, 0)).getUTCDate();
  const targetDay = Math.min(day, daysInMonth);
  const years = targetY - base.getUTCFullYear();
  if (years < 1) return null;

  return { date: `${monthPrefix}-${`${targetDay}`.padStart(2, "0")}`, years };
}

export async function buildAnniversaryMonthItems(userId: string, month: string): Promise<CalendarMonthItem[]> {
  const monthPrefix = toMonthPrefix(month);
  const records = await listAnniversaries(userId);
  const items: CalendarMonthItem[] = [];

  for (const record of records) {
    if (record.category === "relationship") {
      for (const milestone of relationshipHundredDayProjections(record, monthPrefix)) {
        items.push({
          kind: "anniversary",
          date: milestone.date,
          title: formatRelationshipMilestoneTitle(record.name, milestone.dayCount),
          category: record.category,
          reminderEnabled: record.reminderEnabled,
          noteSummary: summarizeNote(record.note),
          ruleType: record.ruleType
        });
      }

      const yearly = relationshipYearlyProjection(record, monthPrefix);
      if (yearly) {
        items.push({
          kind: "anniversary",
          date: yearly.date,
          title: formatRelationshipYearlyTitle(record.name, yearly.years),
          category: record.category,
          reminderEnabled: record.reminderEnabled,
          noteSummary: summarizeNote(record.note),
          ruleType: record.ruleType
        });
      }
      continue;
    }

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
        title: formatAnniversaryTitle(record.name, record.baseDate, date),
        category: record.category,
        reminderEnabled: record.reminderEnabled,
        noteSummary: summarizeNote(record.note),
        ruleType: record.ruleType
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
