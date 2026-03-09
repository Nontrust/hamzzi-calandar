import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import {
  createDefaultAnniversary,
  fetchAnniversaries,
  mapErrorToMessage,
  removeAnniversary,
  renameAnniversary
} from "../../src/anniversaryClient";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");

type AnniversaryRecord = {
  id: string;
  userId: string;
  name: string;
  baseDate: string;
  ruleType: "day_offset" | "monthly" | "yearly";
  ruleValue: number;
  isActive: boolean;
};

export default function AnniversariesPage() {
  const { activeRole } = useActiveRole();
  const [notice, setNotice] = useState("기념일 목록을 불러오세요.");
  const [items, setItems] = useState<AnniversaryRecord[]>([]);

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
    const res = await fetchAnniversaries(activeRole);
    if (res.success) {
      setItems(res.data);
      setNotice("기념일 동기화 완료");
      return;
    }
    setNotice(mapErrorToMessage(res.errorCode));
  }

  async function addAnniversary() {
    const res = await createDefaultAnniversary(activeRole);
    if (!res.success) {
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setNotice("기념일이 생성되었습니다.");
    await refresh();
  }

  async function editFirstAnniversary() {
    const first = items[0];
    if (!first) {
      setNotice("수정할 기념일이 없습니다.");
      return;
    }
    const res = await renameAnniversary(activeRole, first.id, "햄찌 데이");
    if (!res.success) {
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setNotice("첫 기념일 이름을 수정했습니다.");
    await refresh();
  }

  async function deleteFirstAnniversary() {
    const first = items[0];
    if (!first) {
      setNotice("삭제할 기념일이 없습니다.");
      return;
    }
    const res = await removeAnniversary(activeRole, first.id);
    if (!res.success) {
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setNotice("첫 기념일을 삭제했습니다.");
    await refresh();
  }

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.homeHero} nativeID="home-hero-anniversaries" testID="home-hero-anniversaries">
        <View style={styles.homeHeroGlowPrimary} />
        <View style={styles.homeHeroGlowSecondary} />
        <View
          style={styles.homeHeroMarkBox}
          nativeID="home-hero-anniversaries-mark"
          testID="home-hero-anniversaries-mark"
        >
          <Image source={BRAND_MARK} style={styles.homeHeroMark} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.homeHeroTitle}>우리의 기념일</Text>
          <Text style={styles.homeHeroSub}>소중한 날짜를 저장하고 편하게 관리해요.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기념일 관리</Text>
        <Text style={styles.sectionSub}>{notice}</Text>
        <View style={styles.actionsWrap}>
          <AppButton label="기념일 추가" onPress={() => void addAnniversary()} />
          <AppButton label="첫 항목 수정" onPress={() => void editFirstAnniversary()} variant="secondary" />
          <AppButton label="첫 항목 삭제" onPress={() => void deleteFirstAnniversary()} variant="danger" />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기념일 목록</Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>등록된 기념일이 없습니다.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.eventRow}>
              <View style={[styles.eventDot, styles.dotAnniversary]} />
              <View style={styles.flex1}>
                <Text style={styles.eventTitle}>{item.name}</Text>
                <Text style={styles.eventMeta}>
                  {item.baseDate} · {item.ruleType}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
