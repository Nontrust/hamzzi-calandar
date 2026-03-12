import React, { useEffect, useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  createAnniversaryDetailed,
  fetchAnniversaries,
  mapErrorToMessage,
  removeAnniversary,
  type AnniversaryCategory,
  type AnniversaryRecord,
  updateAnniversaryDetailed
} from "../../src/anniversaryClient";
import { formatDateInput, isValidIsoDate } from "../../src/dateInput";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");
const CATEGORY_OPTIONS: AnniversaryCategory[] = ["anniversary", "other"];

const CATEGORY_LABEL: Record<AnniversaryCategory, string> = {
  birthday: "생일",
  relationship: "사귄날",
  anniversary: "기념일",
  other: "기타"
};

type ModalMode = "create" | "edit";

export default function AnniversariesPage() {
  const { activeRole } = useActiveRole();
  const [notice, setNotice] = useState("기념일 목록을 불러오는 중입니다.");
  const [items, setItems] = useState<AnniversaryRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [baseDate, setBaseDate] = useState("");
  const [category, setCategory] = useState<AnniversaryCategory>("anniversary");
  const [note, setNote] = useState("");
  const [modalError, setModalError] = useState("");

  const birthdayItems = items.filter((item) => item.category === "birthday");
  const relationshipItems = items.filter((item) => item.category === "relationship");
  const anniversaryItems = items.filter((item) => item.category !== "birthday" && item.category !== "relationship");

  useEffect(() => {
    if (!activeRole) {
      setItems([]);
      setNotice("사용할 역할을 선택해 주세요.");
      return;
    }
    void refresh();
  }, [activeRole]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setBaseDate("");
    setCategory("anniversary");
    setNote("");
    setModalError("");
  }

  function closeModal() {
    setModalVisible(false);
    resetForm();
  }

  function openCreateModal() {
    resetForm();
    setModalMode("create");
    setModalVisible(true);
  }

  function openEditModal(item: AnniversaryRecord) {
    if (item.isDeleteLocked || item.category === "birthday" || item.category === "relationship") {
      setNotice(item.category === "relationship" ? "사귄날은 수정할 수 없습니다." : "생일은 수정할 수 없습니다.");
      return;
    }
    setModalMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setBaseDate(item.baseDate);
    setCategory(item.category);
    setNote(item.note);
    setModalVisible(true);
  }

  function handleBaseDateChange(value: string) {
    setBaseDate(formatDateInput(value));
  }

  async function refresh() {
    if (!activeRole) return;
    const res = await fetchAnniversaries(activeRole);
    if (!res.success) {
      setNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setItems(res.data);
    setNotice("기념일 목록을 불러왔습니다.");
  }

  async function submitModal() {
    const trimmedName = name.trim();
    const trimmedDate = baseDate.trim();

    if (!trimmedName) {
      setModalError("기념일 이름을 입력해 주세요.");
      return;
    }
    if (!trimmedDate) {
      setModalError("날짜를 입력해 주세요.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      setModalError("날짜는 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }
    if (!isValidIsoDate(trimmedDate)) {
      setModalError("실제로 존재하는 날짜를 입력해 주세요.");
      return;
    }

    setModalError("");
    const payload = {
      name: trimmedName,
      baseDate: trimmedDate,
      category,
      note,
      reminderEnabled: false,
      reminderOffsetDays: 0,
      ruleType: "yearly" as const,
      ruleValue: 1
    };

    const result =
      modalMode === "edit" && editingId
        ? await updateAnniversaryDetailed(activeRole, editingId, payload)
        : await createAnniversaryDetailed(activeRole, payload);

    if (!result.success) {
      setNotice(mapErrorToMessage(result.errorCode));
      return;
    }

    setNotice(modalMode === "edit" ? "기념일을 수정했습니다." : "기념일을 추가했습니다.");
    closeModal();
    await refresh();
  }

  async function deleteItem(item: AnniversaryRecord) {
    const result = await removeAnniversary(activeRole, item.id);
    if (!result.success) {
      setNotice(mapErrorToMessage(result.errorCode));
      return;
    }
    setNotice(`"${item.name}" 기념일을 삭제했습니다.`);
    if (editingId === item.id) resetForm();
    await refresh();
  }

  function isEditLocked(item: AnniversaryRecord) {
    return item.isDeleteLocked || item.category === "birthday" || item.category === "relationship";
  }

  function isDeleteLocked(item: AnniversaryRecord) {
    return item.isDeleteLocked || item.category === "birthday" || item.category === "relationship";
  }

  function renderListSection(title: string, sectionItems: AnniversaryRecord[], emptyMessage: string) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {sectionItems.length === 0 ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        ) : (
          sectionItems.map((item) => (
            <View key={item.id} style={styles.eventRow}>
              <View style={[styles.eventDot, styles.dotAnniversary]} />
              <View style={styles.flex1}>
                <View style={styles.eventHeaderRow}>
                  <Text style={styles.eventTitle}>{item.name}</Text>
                  {item.isDeleteLocked ? (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockBadgeText}>기본 항목</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.eventMeta}>
                  {item.baseDate}  {CATEGORY_LABEL[item.category]}
                </Text>
                <Text style={styles.eventMeta}>{item.note || "-"}</Text>
                {!isEditLocked(item) || !isDeleteLocked(item) ? (
                  <View style={styles.actionsRow}>
                    {!isEditLocked(item) ? (
                      <View style={styles.actionItem}>
                        <AppButton label="수정" onPress={() => openEditModal(item)} variant="secondary" />
                      </View>
                    ) : null}
                    {!isDeleteLocked(item) ? (
                      <View style={styles.actionItem}>
                        <AppButton label="삭제" onPress={() => void deleteItem(item)} variant="danger" />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
        <View style={styles.homeHero} nativeID="home-hero-anniversaries" testID="home-hero-anniversaries">
          <View style={styles.homeHeroGlowPrimary} />
          <View style={styles.homeHeroGlowSecondary} />
          <View style={styles.homeHeroMarkBox} nativeID="home-hero-anniversaries-mark" testID="home-hero-anniversaries-mark">
            <Image source={BRAND_MARK} style={styles.homeHeroMark} resizeMode="contain" accessible={false} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.homeHeroTitle}>기념일 관리</Text>
            <Text style={styles.homeHeroSub}>추가, 수정, 삭제를 버튼으로 나누고 입력은 모달에서 처리합니다.</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>기념일 작업</Text>
          <Text style={styles.sectionSub}>{notice}</Text>
          <View style={styles.actionsRow}>
            <View style={styles.actionItem}>
              <AppButton label="기념일 추가" onPress={openCreateModal} />
            </View>
          </View>
        </View>

        {renderListSection("생일", birthdayItems, "등록된 생일이 없습니다.")}
        {renderListSection("사귄날", relationshipItems, "등록된 사귄날이 없습니다.")}
        {renderListSection("기념일", anniversaryItems, "등록된 기념일이 없습니다.")}
      </ScrollView>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropHit} onPress={closeModal} />
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>{modalMode === "edit" ? "기념일 수정" : "기념일 추가"}</Text>
            <Text style={styles.sectionSub}>
              {modalMode === "edit" ? "선택한 기념일 정보를 수정합니다." : "새 기념일 정보를 입력합니다."}
            </Text>
            {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}

            <Text style={styles.sectionSub}>이름</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="기념일 이름" />

            <Text style={styles.sectionSub}>날짜</Text>
            <TextInput
              style={styles.input}
              value={baseDate}
              onChangeText={handleBaseDateChange}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={10}
            />

            <Text style={styles.sectionSub}>메모</Text>
            <TextInput
              style={[styles.input, styles.modalTextarea]}
              value={note}
              onChangeText={setNote}
              placeholder="메모"
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.sectionSub}>카테고리</Text>
            {Platform.OS === "web" ? (
              <View style={styles.input}>
                {React.createElement(
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
                )}
              </View>
            ) : (
              <View style={styles.roleRowWrap}>
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

            <View style={styles.actionsRow}>
              <View style={styles.actionItem}>
                <AppButton label={modalMode === "edit" ? "수정 완료" : "추가"} onPress={() => void submitModal()} />
              </View>
              <View style={styles.actionItem}>
                <AppButton label="취소" onPress={closeModal} variant="secondary" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}


