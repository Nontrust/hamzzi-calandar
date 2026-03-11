import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View, Platform } from "react-native";
import {
  createAnniversaryDetailed,
  fetchAnniversaries,
  mapErrorToMessage,
  removeAnniversary,
  type AnniversaryCategory,
  type AnniversaryRecord,
  updateAnniversaryDetailed
} from "../../src/anniversaryClient";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");
const CATEGORY_OPTIONS: AnniversaryCategory[] = ["birthday", "anniversary", "study", "other"];

const CATEGORY_LABEL: Record<AnniversaryCategory, string> = {
  birthday: "생일",
  anniversary: "기념일",
  study: "학습",
  other: "기타"
};

function toSafeNumber(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function AnniversariesPage() {
  const { activeRole } = useActiveRole();
  const [notice, setNotice] = useState("기념일 목록을 불러오세요.");
  const [items, setItems] = useState<AnniversaryRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 생성 기본: placeholder 중심 (값 비움)
  const [name, setName] = useState("");
  const [baseDate, setBaseDate] = useState("");
  const [category, setCategory] = useState<AnniversaryCategory>("anniversary");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setNotice("역할을 먼저 선택해 주세요.");
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole]);

  function resetFormForCreate() {
    setEditingId(null);
    setName("");
    setBaseDate("");
    setCategory("anniversary");
    setNote("");
  }

  function loadFormFromRecord(item: AnniversaryRecord) {
    setEditingId(item.id);
    setName(item.name);
    setBaseDate(item.baseDate);
    setCategory(item.category);
    setNote(item.note);
    setNotice(`"${item.name}" 항목을 수정 모드로 불러왔습니다.`);
  }

  async function refresh() {
    if (!activeRole) return;
    const res = await fetchAnniversaries(activeRole);
    if (!res.success) {
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setItems(res.data);
    setNotice("기념일 동기화 완료");
  }

  async function addAnniversary() {
    const result = await createAnniversaryDetailed(activeRole, {
      name,
      baseDate,
      category,
      note,
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "yearly",
      ruleValue: 1
    });
    if (!result.success) {
      setNotice(mapErrorToMessage(result.errorCode));
      return;
    }
    setNotice("기념일이 생성되었습니다.");
    resetFormForCreate();
    await refresh();
  }

  async function updateSelectedAnniversary() {
    if (!editingId) {
      setNotice("수정할 항목을 목록에서 먼저 선택해 주세요.");
      return;
    }

    const result = await updateAnniversaryDetailed(activeRole, editingId, {
      name,
      baseDate,
      category,
      note,
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "yearly",
      ruleValue: 1
    });
    if (!result.success) {
      setNotice(mapErrorToMessage(result.errorCode));
      return;
    }
    setNotice("선택한 기념일을 수정했습니다.");
    await refresh();
  }

  async function submitBySelection() {
    if (editingId) {
      await updateSelectedAnniversary();
      return;
    }
    await addAnniversary();
  }

  async function deleteSelectedAnniversary() {
    if (!editingId) {
      setNotice("삭제할 항목을 목록에서 먼저 선택해 주세요.");
      return;
    }
    const result = await removeAnniversary(activeRole, editingId);
    if (!result.success) {
      setNotice(mapErrorToMessage(result.errorCode));
      return;
    }
    setNotice("선택한 기념일을 삭제했습니다.");
    resetFormForCreate();
    await refresh();
  }

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.homeHero} nativeID="home-hero-anniversaries" testID="home-hero-anniversaries">
        <View style={styles.homeHeroGlowPrimary} />
        <View style={styles.homeHeroGlowSecondary} />
        <View style={styles.homeHeroMarkBox} nativeID="home-hero-anniversaries-mark" testID="home-hero-anniversaries-mark">
          <Image source={BRAND_MARK} style={styles.homeHeroMark} resizeMode="contain" accessible={false} />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.homeHeroTitle}>기념일 상세 관리</Text>
          <Text style={styles.homeHeroSub}>입력 가이드를 보며 생성하고, 목록 선택 후 수정하세요.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기념일 입력</Text>
        <Text style={styles.sectionSub}>{notice}</Text>
        <Text style={styles.sectionSub}>현재 모드: {editingId ? "수정" : "생성"}</Text>

        <Text style={styles.sectionSub}>이름</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="기념일 이름" />

        <Text style={styles.sectionSub}>날짜</Text>
        <TextInput style={styles.input} value={baseDate} onChangeText={setBaseDate} placeholder="YYYY-MM-DD" />

        <Text style={styles.sectionSub}>메모</Text>
        <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="메모" />

        <Text style={styles.sectionSub}>카테고리 선택</Text>
        {Platform.OS === "web" ? (
          <View style={styles.input}>
            {/*
              Use native web <select>/<option> for clear form semantics on web.
            */}
            {(() =>
              React.createElement(
                "select",
                {
                  value: category,
                  onChange: (e: { target: { value: AnniversaryCategory } }) => setCategory(e.target.value),
                  style: {
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 15,
                    color: "#0f172a"
                  }
                },
                CATEGORY_OPTIONS.map((option) => React.createElement("option", { key: option, value: option }, CATEGORY_LABEL[option]))
              ))()}
          </View>
        ) : (
          <View style={styles.roleRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.roleChip, category === option && styles.roleChipActive]}
                onPress={() => setCategory(option)}
              >
                <Text style={[styles.roleChipText, category === option && styles.roleChipTextActive]}>{CATEGORY_LABEL[option]}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.actionsWrap}>
          <AppButton label={editingId ? "선택 항목 수정" : "기념일 생성"} onPress={() => void submitBySelection()} />
          <AppButton label="선택 항목 삭제" onPress={() => void deleteSelectedAnniversary()} variant="danger" />
          <AppButton label={editingId ? "선택 해제" : "폼 초기화"} onPress={resetFormForCreate} variant="secondary" />
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
                  {item.baseDate} · {item.category}
                </Text>
                <Text style={styles.eventMeta}>note={item.note || "-"}</Text>
                <View style={styles.actionsWrap}>
                  <AppButton
                    label={editingId === item.id ? "선택됨" : "이 항목 선택"}
                    onPress={() => loadFormFromRecord(item)}
                    variant={editingId === item.id ? "primary" : "secondary"}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
