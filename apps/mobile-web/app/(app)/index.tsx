import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from "react-native";
import { canManageRewards, getRoleHelper, getRoleLabel, type UserRole } from "@nahamzzi/domain";
import { logout } from "../../src/authClient";
import {
  createDefaultAnniversary,
  fetchAnniversaries,
  fetchCalendarMonth,
  mapErrorToMessage,
  removeAnniversary,
  renameAnniversary
} from "../../src/anniversaryClient";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

const ACTIVE_ROLE_KEY = "active-role";
const BRAND_MARK = require("../../../../openspec/statics/nahamzzi_mark.png");

type MonthItem = { kind: "exam" | "anniversary"; date: string; title: string };

function getPermissionLabel(status: string) {
  switch (status) {
    case "granted":
      return "허용";
    case "denied":
      return "거부";
    case "unavailable":
      return "지원 안 됨";
    case "error":
      return "오류";
    case "idle":
    default:
      return "미요청";
  }
}

function getItemKindLabel(kind: MonthItem["kind"]) {
  return kind === "anniversary" ? "기념일" : "시험";
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, setSession } = useAuthSession();
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [apiNotice, setApiNotice] = useState("연결됨");
  const [monthItems, setMonthItems] = useState<MonthItem[]>([]);
  const [anniversaryIds, setAnniversaryIds] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState({
    biometric: "idle",
    calendar: "idle",
    photo: "idle"
  });

  useEffect(() => {
    void initializeRole();
  }, [session]);

  useEffect(() => {
    if (!session || !activeRole) {
      setMonthItems([]);
      setAnniversaryIds([]);
      return;
    }
    void refreshFromServer(activeRole);
  }, [session, activeRole]);

  const monthSummary = useMemo(() => {
    const exams = monthItems.filter((item) => item.kind === "exam").length;
    const anniversaries = monthItems.filter((item) => item.kind === "anniversary").length;
    return { exams, anniversaries, total: monthItems.length };
  }, [monthItems]);

  async function initializeRole() {
    if (!session) {
      setActiveRole(null);
      return;
    }

    const savedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
    if (savedRole === "A" || savedRole === "B") {
      setActiveRole(savedRole);
      return;
    }

    const fallbackRole = session.user.defaultRole;
    setActiveRole(fallbackRole);
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, fallbackRole);
  }

  async function onLogout() {
    await logout();
    await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
    setSession(null);
    setActiveRole(null);
    setApiNotice("로그아웃되었습니다.");
    router.replace("/login");
  }

  async function selectRole(role: UserRole) {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  }

  async function refreshFromServer(role: UserRole) {
    try {
      const monthRes = await fetchCalendarMonth(role, "2026-03");
      if (monthRes.success) {
        setMonthItems(monthRes.data.items);
        setApiNotice("월간 데이터 동기화 완료");
      } else {
        setApiNotice(mapErrorToMessage(monthRes.errorCode));
      }
    } catch {
      setApiNotice("월간 데이터를 불러오지 못했습니다.");
    }

    try {
      const listRes = await fetchAnniversaries(role);
      if (listRes.success) {
        setAnniversaryIds(listRes.data.map((item) => item.id));
      } else {
        setApiNotice(mapErrorToMessage(listRes.errorCode));
      }
    } catch {
      setApiNotice("기념일 목록을 불러오지 못했습니다.");
    }
  }

  async function addAnniversary() {
    const res = await createDefaultAnniversary(activeRole);
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일이 생성되었습니다.");
    if (activeRole) await refreshFromServer(activeRole);
  }

  async function editFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("수정할 기념일이 없습니다.");
      return;
    }
    const res = await renameAnniversary(activeRole, first, "햄찌 데이");
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일이 수정되었습니다.");
    if (activeRole) await refreshFromServer(activeRole);
  }

  async function deleteFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("삭제할 기념일이 없습니다.");
      return;
    }
    const res = await removeAnniversary(activeRole, first);
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일이 삭제되었습니다.");
    if (activeRole) await refreshFromServer(activeRole);
  }

  async function requestBiometricOnDemand() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    setPermissionState((prev) => ({ ...prev, biometric: hasHardware ? "granted" : "unavailable" }));
  }

  async function requestCalendarOnDemand() {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setPermissionState((prev) => ({ ...prev, calendar: status }));
    } catch {
      setPermissionState((prev) => ({ ...prev, calendar: "error" }));
      setApiNotice("캘린더 권한 요청에 실패했습니다.");
    }
  }

  async function requestPhotoOnDemand() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPermissionState((prev) => ({ ...prev, photo: status }));
    } catch {
      setPermissionState((prev) => ({ ...prev, photo: "error" }));
      setApiNotice("사진 권한 요청에 실패했습니다.");
    }
  }

  if (!session) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.flex1}>
            <Text style={styles.headerTitle}>{session.user.displayName}</Text>
            <Text style={styles.headerSub}>{session.user.loginId}</Text>
          </View>
          <View style={styles.emblemBadge}>
            <View style={styles.emblemGlowPrimary} />
            <View style={styles.emblemGlowSecondary} />
            <Image source={BRAND_MARK} style={styles.logoSmall} resizeMode="contain" accessible={false} />
          </View>
        </View>

        <View style={styles.roleRow}>
          <Pressable
            onPress={() => void selectRole("A")}
            style={[styles.roleChip, activeRole === "A" && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, activeRole === "A" && styles.roleChipTextActive]}>
              {getRoleLabel("A")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void selectRole("B")}
            style={[styles.roleChip, activeRole === "B" && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, activeRole === "B" && styles.roleChipTextActive]}>
              {getRoleLabel("B")}
            </Text>
          </Pressable>
          <AppButton label="로그아웃" onPress={() => void onLogout()} variant="secondary" />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>역할 안내</Text>
          <Text style={styles.infoBody}>{activeRole ? getRoleHelper(activeRole) : "역할을 선택해 주세요."}</Text>
          <Text style={styles.infoMeta}>
            보상 관리 권한: {activeRole && canManageRewards(activeRole) ? "허용" : "제한"}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>전체 항목</Text>
            <Text style={styles.statValue}>{monthSummary.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>시험</Text>
            <Text style={styles.statValue}>{monthSummary.exams}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>기념일</Text>
            <Text style={styles.statValue}>{monthSummary.anniversaries}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3월 타임라인</Text>
          <Text style={styles.sectionSub}>{apiNotice}</Text>
          {monthItems.length === 0 ? (
            <Text style={styles.emptyText}>아직 등록된 일정이 없습니다.</Text>
          ) : (
            monthItems.map((item) => (
              <View key={`${item.kind}-${item.date}-${item.title}`} style={styles.eventRow}>
                <View style={[styles.eventDot, item.kind === "anniversary" ? styles.dotAnniversary : styles.dotExam]} />
                <View style={styles.flex1}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventMeta}>{item.date} · {getItemKindLabel(item.kind)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>빠른 실행</Text>
          <View style={styles.actionsWrap}>
            <AppButton label="기념일 추가" onPress={() => void addAnniversary()} />
            <AppButton label="첫 항목 수정" onPress={() => void editFirstAnniversary()} variant="secondary" />
            <AppButton label="첫 항목 삭제" onPress={() => void deleteFirstAnniversary()} variant="danger" />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>권한 관리</Text>
          <View style={styles.actionsWrap}>
            <AppButton label="생체 인증" onPress={() => void requestBiometricOnDemand()} variant="secondary" />
            <AppButton label="캘린더" onPress={() => void requestCalendarOnDemand()} variant="secondary" />
            <AppButton label="사진 라이브러리" onPress={() => void requestPhotoOnDemand()} variant="secondary" />
          </View>
          <Text style={styles.permissionText}>생체 인증: {getPermissionLabel(permissionState.biometric)}</Text>
          <Text style={styles.permissionText}>캘린더: {getPermissionLabel(permissionState.calendar)}</Text>
          <Text style={styles.permissionText}>사진: {getPermissionLabel(permissionState.photo)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
