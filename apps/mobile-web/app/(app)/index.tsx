import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { fetchCalendarMonth, mapErrorToMessage } from "../../src/anniversaryClient";
import { fetchKoreanPublicHolidays } from "../../src/holidayClient";
import { AppButton } from "../src/ui/AppButton";
import { useActiveRole } from "../src/auth/useActiveRole";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");

type MonthItem = {
  kind: "exam" | "anniversary";
  date: string;
  title: string;
  category?: "birthday" | "anniversary" | "study" | "other";
  reminderEnabled?: boolean;
  noteSummary?: string;
  ruleType?: "day_offset" | "monthly" | "yearly";
};
type HolidayItem = { date: string; title: string };
type CalendarCell = { type: "blank" } | { type: "day"; day: number; iso: string };

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function moveMonth(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}
function monthLabel(month: string) {
  const [year, mm] = month.split("-");
  return `${year}년 ${Number(mm)}월`;
}
function toKindLabel(item: MonthItem | { kind: "holiday" }) {
  if (item.kind === "holiday") return "공휴일";
  return item.kind === "anniversary" ? "기념일" : "일정";
}

export default function HomeScreen() {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const [notice, setNotice] = useState("");
  const [items, setItems] = useState<MonthItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);

  const today = new Date();
  const todayIso = formatDate(today);
  const [viewMonthDate, setViewMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const viewMonth = formatMonth(viewMonthDate);
  const [selectedDate, setSelectedDate] = useState(todayIso);

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setHolidays([]);
      setNotice("권한 정보를 불러오는 중입니다.");
      return;
    }
    void refreshMonth(viewMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, viewMonth]);

  async function refreshMonth(month: string) {
    if (!activeRole) return;
    const [calendarRes, holidayRes] = await Promise.all([
      fetchCalendarMonth(activeRole, month),
      fetchKoreanPublicHolidays(Number(month.slice(0, 4)))
    ]);

    if (!calendarRes.success) {
      setItems([]);
      setHolidays([]);
      setNotice(mapErrorToMessage(calendarRes.errorCode));
      return;
    }

    const monthHolidays = holidayRes
      .filter((item) => item.date.startsWith(`${month}-`))
      .map((item) => ({ date: item.date, title: item.localName || item.name }));

    setItems([...calendarRes.data.items].sort((a, b) => a.date.localeCompare(b.date)));
    setHolidays(monthHolidays);
    setNotice(calendarRes.errorCode === "EXTERNAL_SYNC_FAILED" ? mapErrorToMessage("EXTERNAL_SYNC_FAILED") : "");

    const firstDay = `${month}-01`;
    const hasSelectedInMonth = selectedDate.startsWith(`${month}-`);
    setSelectedDate(hasSelectedInMonth ? selectedDate : firstDay);
  }

  const dateCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.date, (map.get(item.date) ?? 0) + 1);
    for (const item of holidays) map.set(item.date, (map.get(item.date) ?? 0) + 1);
    return map;
  }, [items, holidays]);

  const holidayDateSet = useMemo(() => new Set(holidays.map((item) => item.date)), [holidays]);

  const monthCells = useMemo(() => {
    const [yearRaw, monthRaw] = viewMonth.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ type: "blank" });
    for (let day = 1; day <= lastDate; day += 1) cells.push({ type: "day", day, iso: `${viewMonth}-${String(day).padStart(2, "0")}` });
    while (cells.length % 7 !== 0) cells.push({ type: "blank" });
    return cells;
  }, [viewMonth]);

  const calendarRows = useMemo(() => {
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < monthCells.length; i += 7) rows.push(monthCells.slice(i, i + 7));
    return rows;
  }, [monthCells]);

  const selectedDateItems = useMemo(() => {
    const base = items.map((item) => ({ id: `${item.kind}-${item.date}-${item.title}`, ...item }));
    const holiday = holidays.map((item) => ({ id: `holiday-${item.date}-${item.title}`, kind: "holiday" as const, date: item.date, title: item.title }));
    return [...base, ...holiday].filter((item) => item.date === selectedDate);
  }, [items, holidays, selectedDate]);

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.homeHero} nativeID="home-hero-main" testID="home-hero-main">
        <View style={styles.homeHeroGlowPrimary} />
        <View style={styles.homeHeroGlowSecondary} />
        <View style={styles.homeHeroMarkBox} nativeID="home-hero-main-mark" testID="home-hero-main-mark">
          <Image source={BRAND_MARK} style={[styles.homeHeroMark, styles.homeHeroMarkMain]} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.homeHeroTitle}>햄찌의 하루</Text>
          <Text style={styles.homeHeroSub}>오늘 일정과 기념일 상세 정보를 한눈에 확인해요.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>이번 달 캘린더</Text>
        <View style={styles.calendarMonthRow}>
          <Pressable style={styles.calendarMonthButton} onPress={() => setViewMonthDate((prev) => moveMonth(prev, -1))}>
            <Text style={styles.calendarMonthButtonText}>이전</Text>
          </Pressable>
          <Text style={styles.calendarMonthTitle}>{monthLabel(viewMonth)}</Text>
          <Pressable style={styles.calendarMonthButton} onPress={() => setViewMonthDate((prev) => moveMonth(prev, 1))}>
            <Text style={styles.calendarMonthButtonText}>다음</Text>
          </Pressable>
        </View>
        {notice ? <Text style={styles.sectionSub}>{notice}</Text> : null}

        <View style={styles.calendarWeekRow}>
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <Text key={day} style={[styles.calendarWeekLabel, idx === 0 && styles.calendarSundayText, idx === 6 && styles.calendarSaturdayText]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.calendarGridRow}>
              {row.map((cell, colIndex) => {
                if (cell.type === "blank") return <View key={`blank-${rowIndex}-${colIndex}`} style={[styles.calendarCell, styles.calendarCellBlank]} />;

                const hasEvents = (dateCountMap.get(cell.iso) ?? 0) > 0;
                const isToday = cell.iso === todayIso;
                const isSelected = cell.iso === selectedDate;
                const isHoliday = holidayDateSet.has(cell.iso);
                const isSunday = colIndex === 0;
                const isSaturday = colIndex === 6;

                return (
                  <Pressable
                    key={cell.iso}
                    onPress={() => setSelectedDate(cell.iso)}
                    style={[
                      styles.calendarCell,
                      hasEvents && styles.calendarCellActive,
                      isHoliday && styles.calendarHolidayCell,
                      isToday && styles.calendarCellToday,
                      isSelected && styles.calendarCellSelected
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSunday && styles.calendarSundayText,
                        isSaturday && styles.calendarSaturdayText,
                        isHoliday && styles.calendarHolidayText,
                        hasEvents && styles.calendarDayTextActive,
                        (isToday || isSelected) && styles.calendarDayTextToday
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {hasEvents ? <View style={[styles.calendarDot, isHoliday && styles.calendarHolidayDot]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>선택한 날짜 일정</Text>
        <Text style={styles.sectionSub}>{selectedDate}</Text>
        {selectedDateItems.length === 0 ? (
          <Text style={styles.emptyText}>해당 날짜에 등록된 일정이 없습니다.</Text>
        ) : (
          selectedDateItems.map((item) => (
            <View key={item.id} style={styles.eventRow}>
              <View
                style={[
                  styles.eventDot,
                  item.kind === "anniversary" ? styles.dotAnniversary : item.kind === "holiday" ? styles.dotHoliday : styles.dotExam
                ]}
              />
              <View style={styles.flex1}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={[styles.eventMeta, item.kind === "holiday" && styles.eventMetaHoliday]}>
                  {toKindLabel(item as MonthItem | { kind: "holiday" })} · {item.date}
                </Text>
                {"category" in item && item.category ? (
                  <Text style={styles.eventMeta}>
                    category={item.category} · reminder={item.reminderEnabled ? "on" : "off"} · rule={item.ruleType}
                  </Text>
                ) : null}
                {"noteSummary" in item && item.noteSummary ? <Text style={styles.eventMeta}>note={item.noteSummary}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>빠른 이동</Text>
        <View style={styles.actionsWrap}>
          <AppButton label="기념일 페이지" onPress={() => router.push("/anniversaries")} variant="secondary" />
          <AppButton label="일정 페이지" onPress={() => router.push("/schedule")} variant="secondary" />
          <AppButton label="설정 페이지" onPress={() => router.push("/settings")} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}
