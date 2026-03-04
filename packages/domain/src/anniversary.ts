export interface AnniversaryRule {
  name: string;
  baseDate: string; // YYYY-MM-DD
  dayOffset?: number; // D+N
  monthInterval?: number; // monthly repeat
  yearInterval?: number; // yearly repeat
}

export interface AnniversaryItem {
  kind: "anniversary";
  date: string; // YYYY-MM-DD
  title: string;
  dDayLabel: string;
  hint: string;
  badge: "anniversary-dot";
}

export interface CalendarMonthItem {
  kind: "exam" | "anniversary";
  date: string;
  title: string;
}

function toUtcDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonthsClamped(base: Date, months: number): Date {
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const day = base.getUTCDate();
  const targetYear = year + Math.floor((month + months) / 12);
  const targetMonth = (month + months) % 12;
  const clampedMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
  const monthCarry = targetMonth < 0 ? -1 : 0;
  const finalYear = targetYear + monthCarry;
  const maxDay = daysInMonth(finalYear, clampedMonth);
  return new Date(Date.UTC(finalYear, clampedMonth, Math.min(day, maxDay)));
}

function addYearsClamped(base: Date, years: number): Date {
  const year = base.getUTCFullYear() + years;
  const month = base.getUTCMonth();
  const day = base.getUTCDate();
  const maxDay = daysInMonth(year, month);
  return new Date(Date.UTC(year, month, Math.min(day, maxDay)));
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function formatAnniversaryTitle(name: string, dayCount: number): string {
  return `${name} · D+${dayCount}`;
}

export function formatAnniversaryHint(today: string, targetDate: string): string {
  const delta = diffDays(toUtcDate(today), toUtcDate(targetDate));
  if (delta === 0) {
    return "오늘이 기념일이에요.";
  }
  if (delta > 0) {
    return `${delta}일 남았어요.`;
  }
  return `${Math.abs(delta)}일 지났어요.`;
}

export function calculateAnniversaryDate(rule: AnniversaryRule, today: string): string {
  const base = toUtcDate(rule.baseDate);

  if (rule.dayOffset && rule.dayOffset > 0) {
    const shifted = new Date(base.getTime() + (rule.dayOffset - 1) * 24 * 60 * 60 * 1000);
    return formatDate(shifted);
  }

  if (rule.monthInterval && rule.monthInterval > 0) {
    let current = base;
    while (formatDate(current) < today) {
      current = addMonthsClamped(current, rule.monthInterval);
    }
    return formatDate(current);
  }

  if (rule.yearInterval && rule.yearInterval > 0) {
    let current = base;
    while (formatDate(current) < today) {
      current = addYearsClamped(current, rule.yearInterval);
    }
    return formatDate(current);
  }

  return rule.baseDate;
}

export function buildAnniversaryItem(rule: AnniversaryRule, today: string): AnniversaryItem {
  const date = calculateAnniversaryDate(rule, today);
  const dayCount = Math.max(1, rule.dayOffset ?? 1);
  return {
    kind: "anniversary",
    date,
    title: formatAnniversaryTitle(rule.name, dayCount),
    dDayLabel: formatAnniversaryHint(today, date),
    hint: `기준일 ${rule.baseDate} 기준`,
    badge: "anniversary-dot"
  };
}

export function buildCalendarMonthItems(
  month: string,
  examItems: CalendarMonthItem[],
  anniversaries: AnniversaryItem[]
): CalendarMonthItem[] {
  return [...examItems, ...anniversaries]
    .filter((item) => item.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
}
