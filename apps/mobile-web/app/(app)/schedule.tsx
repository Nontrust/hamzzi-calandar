import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { fetchCalendarMonth, mapErrorToMessage } from "../../src/anniversaryClient";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");

type MonthItem = { kind: "exam" | "anniversary"; date: string; title: string };

function getItemKindLabel(kind: MonthItem["kind"]) {
  return kind === "anniversary" ? "기념일" : "시험";
}

export default function SchedulePage() {
  const { activeRole } = useActiveRole();
  const [notice, setNotice] = useState("월간 일정을 불러오세요.");
  const [items, setItems] = useState<MonthItem[]>([]);

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setNotice("역할을 먼저 선택해 주세요.");
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  async function refresh() {
    if (!activeRole) return;
    const res = await fetchCalendarMonth(activeRole, "2026-03");
    if (res.success) {
      setItems(res.data.items);
      setNotice("3월 일정 동기화 완료");
      return;
    }
    setNotice(mapErrorToMessage(res.errorCode));
  }

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.homeHero} nativeID="home-hero-schedule" testID="home-hero-schedule">
        <View style={styles.homeHeroGlowPrimary} />
        <View style={styles.homeHeroGlowSecondary} />
        <View style={styles.homeHeroMarkBox} nativeID="home-hero-schedule-mark" testID="home-hero-schedule-mark">
          <Image source={BRAND_MARK} style={styles.homeHeroMark} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.homeHeroTitle}>오늘의 일정</Text>
          <Text style={styles.homeHeroSub}>시험과 기념일 일정을 한 번에 확인해요.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>월간 일정</Text>
        <Text style={styles.sectionSub}>{notice}</Text>
        <AppButton label="다시 불러오기" onPress={() => void refresh()} variant="secondary" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3월 타임라인</Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>표시할 일정이 없습니다.</Text>
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
    </ScrollView>
  );
}
