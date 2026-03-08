import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { canManageRewards, getRoleHelper, getRoleLabel } from "@nahamzzi/domain";
import { fetchCalendarMonth, mapErrorToMessage } from "../../src/anniversaryClient";
import { AppButton } from "../src/ui/AppButton";
import { useActiveRole } from "../src/auth/useActiveRole";
import { styles } from "../src/ui/appStyles";

type MonthItem = { kind: "exam" | "anniversary"; date: string; title: string };
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

function toKindLabel(kind: MonthItem["kind"]) {
  return kind === "anniversary" ? "기념일" : "시험";
}

export default function HomeScreen() {
  const router = useRouter();
  const { activeRole, selectRole } = useActiveRole();
  const [notice, setNotice] = useState("일정을 불러오는 중...");
  const [items, setItems] = useState<MonthItem[]>([]);

  const today = new Date();
  const todayIso = formatDate(today);
  const [viewMonthDate, setViewMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const viewMonth = formatMonth(viewMonthDate);
  const [selectedDate, setSelectedDate] = useState(todayIso);

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setNotice("역할을 먼저 선택해 주세요.");
      return;
    }
    void refreshMonth(viewMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, viewMonth]);

  async function refreshMonth(month: string) {
    if (!activeRole) return;
    const res = await fetchCalendarMonth(activeRole, month);
    if (!res.success) {
      setItems([]);
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }

    setItems([...res.data.items].sort((a, b) => a.date.localeCompare(b.date)));
    const firstDay = `${month}-01`;
    const hasSelectedInMonth = selectedDate.startsWith(`${month}-`);
    setSelectedDate(hasSelectedInMonth ? selectedDate : firstDay);
    setNotice(`선택 월: ${monthLabel(month)}`);
  }

  const dateCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.date, (map.get(item.date) ?? 0) + 1);
    return map;
  }, [items]);

  const monthCells = useMemo(() => {
    const [yearRaw, monthRaw] = viewMonth.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const lastDate = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ type: "blank" });
    for (let day = 1; day <= lastDate; day += 1) {
      cells.push({ type: "day", day, iso: `${viewMonth}-${String(day).padStart(2, "0")}` });
    }
    while (cells.length % 7 !== 0) cells.push({ type: "blank" });
    return cells;
  }, [viewMonth]);

  const calendarRows = useMemo(() => {
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < monthCells.length; i += 7) rows.push(monthCells.slice(i, i + 7));
    return rows;
  }, [monthCells]);

  const selectedDateItems = useMemo(() => items.filter((item) => item.date === selectedDate), [items, selectedDate]);

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>역할 선택</Text>
        <View style={styles.roleRow}>
          <Pressable onPress={() => void selectRole("A")} style={[styles.roleChip, activeRole === "A" && styles.roleChipActive]}>
            <Text style={[styles.roleChipText, activeRole === "A" && styles.roleChipTextActive]}>{getRoleLabel("A")}</Text>
          </Pressable>
          <Pressable onPress={() => void selectRole("B")} style={[styles.roleChip, activeRole === "B" && styles.roleChipActive]}>
            <Text style={[styles.roleChipText, activeRole === "B" && styles.roleChipTextActive]}>{getRoleLabel("B")}</Text>
          </Pressable>
        </View>
        <Text style={styles.infoBody}>{activeRole ? getRoleHelper(activeRole) : "역할을 먼저 선택해 주세요."}</Text>
        <Text style={styles.infoMeta}>보상 관리 권한: {activeRole && canManageRewards(activeRole) ? "허용" : "제한"}</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.calendarHeaderRow}>
          <Text style={styles.sectionTitle}>달력</Text>
          <AppButton label="새로고침" onPress={() => void refreshMonth(viewMonth)} variant="secondary" />
        </View>
        <View style={styles.calendarMonthRow}>
          <Pressable style={styles.calendarMonthButton} onPress={() => setViewMonthDate((prev) => moveMonth(prev, -1))}>
            <Text style={styles.calendarMonthButtonText}>이전</Text>
          </Pressable>
          <Text style={styles.calendarMonthTitle}>{monthLabel(viewMonth)}</Text>
          <Pressable style={styles.calendarMonthButton} onPress={() => setViewMonthDate((prev) => moveMonth(prev, 1))}>
            <Text style={styles.calendarMonthButtonText}>다음</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionSub}>{notice}</Text>

        <View style={styles.calendarWeekRow}>
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <Text key={day} style={styles.calendarWeekLabel}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.calendarGridRow}>
              {row.map((cell, colIndex) => {
                if (cell.type === "blank") {
                  return <View key={`blank-${rowIndex}-${colIndex}`} style={[styles.calendarCell, styles.calendarCellBlank]} />;
                }
                const hasEvents = (dateCountMap.get(cell.iso) ?? 0) > 0;
                const isToday = cell.iso === todayIso;
                const isSelected = cell.iso === selectedDate;
                return (
                  <Pressable
                    key={cell.iso}
                    onPress={() => setSelectedDate(cell.iso)}
                    style={[
                      styles.calendarCell,
                      hasEvents && styles.calendarCellActive,
                      isToday && styles.calendarCellToday,
                      isSelected && styles.calendarCellSelected
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        hasEvents && styles.calendarDayTextActive,
                        (isToday || isSelected) && styles.calendarDayTextToday
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {hasEvents ? <View style={styles.calendarDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>선택 날짜 일정</Text>
        <Text style={styles.sectionSub}>{selectedDate}</Text>
        {selectedDateItems.length === 0 ? (
          <Text style={styles.emptyText}>해당 날짜 일정이 없습니다.</Text>
        ) : (
          selectedDateItems.map((item) => (
            <View key={`${item.kind}-${item.date}-${item.title}`} style={styles.eventRow}>
              <View style={[styles.eventDot, item.kind === "anniversary" ? styles.dotAnniversary : styles.dotExam]} />
              <View style={styles.flex1}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>
                  {toKindLabel(item.kind)} · {item.date}
                </Text>
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
