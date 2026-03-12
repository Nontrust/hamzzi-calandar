import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { fetchCalendarMonth, mapErrorToMessage } from "../../src/anniversaryClient";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");

type MonthItem = { kind: "exam" | "anniversary"; date: string; title: string };

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function moveMonth(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

function monthLabel(month: string) {
  const [year, mm] = month.split("-");
  return `${year}년 ${Number(mm)}월`;
}

function getItemKindLabel(kind: MonthItem["kind"]) {
  return kind === "anniversary" ? "기념일" : "시험";
}

export default function SchedulePage() {
  const { activeRole } = useActiveRole();
  const today = new Date();
  const [viewMonthDate, setViewMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [notice, setNotice] = useState("월간 일정을 불러오는 중입니다.");
  const [items, setItems] = useState<MonthItem[]>([]);

  const viewMonth = formatMonth(viewMonthDate);

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setNotice("사용할 역할을 선택해 주세요.");
      return;
    }
    void refresh(viewMonth);
  }, [activeRole, viewMonth]);

  async function refresh(month: string) {
    if (!activeRole) return;
    const res = await fetchCalendarMonth(activeRole, month);
    if (res.success) {
      setItems(res.data.items);
      setNotice(`${monthLabel(month)} 일정을 불러왔습니다.`);
      return;
    }
    setItems([]);
    setNotice(mapErrorToMessage(res.errorCode));
  }

  const anniversaryItems = items.filter((item) => item.kind === "anniversary");

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.homeHero} nativeID="home-hero-schedule" testID="home-hero-schedule">
        <View style={styles.homeHeroGlowPrimary} />
        <View style={styles.homeHeroGlowSecondary} />
        <View style={styles.homeHeroMarkBox} nativeID="home-hero-schedule-mark" testID="home-hero-schedule-mark">
          <Image source={BRAND_MARK} style={styles.homeHeroMark} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.homeHeroTitle}>월간 일정</Text>
          <Text style={styles.homeHeroSub}>현재 달 기준으로 시험과 기념일을 확인하고, 달을 이동해 볼 수 있어요.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>조회 월</Text>
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
        <AppButton label="다시 불러오기" onPress={() => void refresh(viewMonth)} variant="secondary" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{monthLabel(viewMonth)} 일정</Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>{monthLabel(viewMonth)}에는 표시할 일정이 없습니다.</Text>
        ) : (
          items.map((item) => (
            <View key={`${item.kind}-${item.date}-${item.title}`} style={styles.eventRow}>
              <View style={[styles.eventDot, item.kind === "anniversary" ? styles.dotAnniversary : styles.dotExam]} />
              <View style={styles.flex1}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>
                  {item.date} · {getItemKindLabel(item.kind)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기념일 안내</Text>
        {anniversaryItems.length === 0 ? (
          <Text style={styles.emptyText}>{monthLabel(viewMonth)}에는 등록된 기념일이 없습니다. 이전/다음 달로 이동해 확인해 보세요.</Text>
        ) : (
          anniversaryItems.map((item) => (
            <View key={`anniversary-${item.date}-${item.title}`} style={styles.eventRow}>
              <View style={[styles.eventDot, styles.dotAnniversary]} />
              <View style={styles.flex1}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.date} · 기념일</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
