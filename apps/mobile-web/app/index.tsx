import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Button, SafeAreaView, Text, View } from "react-native";
import {
  canManageRewards,
  getBrandLabel,
  getRoleHelper,
  getRoleLabel,
  type UserRole
} from "@nahamzzi/domain";
import {
  createDefaultAnniversary,
  fetchAnniversaries,
  fetchCalendarMonth,
  mapErrorToMessage,
  removeAnniversary,
  renameAnniversary
} from "../src/anniversaryClient";

const ACTIVE_ROLE_KEY = "active-role";

export default function HomeScreen() {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [apiNotice, setApiNotice] = useState("정상");
  const [monthItems, setMonthItems] = useState<Array<{ kind: "exam" | "anniversary"; date: string; title: string }>>([]);
  const [anniversaryIds, setAnniversaryIds] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState({
    biometric: "idle",
    calendar: "idle",
    photo: "idle"
  });

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_ROLE_KEY).then((savedRole) => {
      if (savedRole === "A" || savedRole === "B") {
        setActiveRole(savedRole);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeRole) {
      setMonthItems([]);
      setAnniversaryIds([]);
      return;
    }
    void refreshFromServer(activeRole);
  }, [activeRole]);

  async function selectRole(role: UserRole) {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  }

  async function refreshFromServer(role: UserRole) {
    const monthRes = await fetchCalendarMonth(role, "2026-03");
    if (monthRes.success) {
      setMonthItems(monthRes.data.items);
      setApiNotice("월 조회 성공");
    } else {
      setApiNotice(mapErrorToMessage(monthRes.errorCode));
    }

    const listRes = await fetchAnniversaries(role);
    if (listRes.success) {
      setAnniversaryIds(listRes.data.map((item) => item.id));
    } else {
      setApiNotice(mapErrorToMessage(listRes.errorCode));
    }
  }

  async function addAnniversary() {
    const res = await createDefaultAnniversary(activeRole);
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일 저장 성공");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function editFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("수정할 기념일이 없어.");
      return;
    }
    const res = await renameAnniversary(activeRole, first, "나햄찌데이");
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일 수정 성공");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function deleteFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("삭제할 기념일이 없어.");
      return;
    }
    const res = await removeAnniversary(activeRole, first);
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("기념일 삭제 성공");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function requestBiometricOnDemand() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    setPermissionState((prev) => ({
      ...prev,
      biometric: hasHardware ? "granted" : "unavailable"
    }));
  }

  async function requestCalendarOnDemand() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setPermissionState((prev) => ({ ...prev, calendar: status }));
  }

  async function requestPhotoOnDemand() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissionState((prev) => ({ ...prev, photo: status }));
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>햄찌의 뽀짝 하루 캘린더</Text>
      <Text>
        활성 멤버: {activeRole ? getRoleLabel(activeRole) : "미선택"}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title={`${getRoleLabel("A")} 선택`} onPress={() => void selectRole("A")} />
        <Button title={`${getRoleLabel("B")} 선택`} onPress={() => void selectRole("B")} />
      </View>

      <Text>관리 기능 접근: {activeRole && canManageRewards(activeRole) ? "허용" : "차단"}</Text>
      {activeRole === "A" ? (
        <Text>{getRoleHelper("A")}</Text>
      ) : activeRole === "B" ? (
        <Text>{getRoleHelper("B")}</Text>
      ) : (
        <Text>먼저 햄찌 멤버를 골라줘.</Text>
      )}

      <Text>{getBrandLabel("study.session")} / {getBrandLabel("study.todo")} / {getBrandLabel("study.achievement")}</Text>
      <Text>{getBrandLabel("reward.card")} 상태: 잠금 / 해금</Text>
      <Text>서버 안내: {apiNotice}</Text>

      <Text style={{ fontWeight: "700", marginTop: 8 }}>이번 달 달력 미리보기</Text>
      {monthItems.map((item) => (
        <View key={`${item.kind}-${item.date}-${item.title}`} style={{ gap: 2 }}>
          <Text>
            {item.kind === "anniversary" ? "● 기념일" : "○ 일반 일정"} {item.date} {item.title}
          </Text>
        </View>
      ))}
      <Button title="기념일 추가(서버 저장)" onPress={() => void addAnniversary()} />
      <Button title="첫 기념일 이름 수정" onPress={() => void editFirstAnniversary()} />
      <Button title="첫 기념일 삭제" onPress={() => void deleteFirstAnniversary()} />

      <Button title="생체인증 권한 요청(필요할 때만)" onPress={() => void requestBiometricOnDemand()} />
      <Button title="캘린더 권한 요청(필요할 때만)" onPress={() => void requestCalendarOnDemand()} />
      <Button title="사진 권한 요청(필요할 때만)" onPress={() => void requestPhotoOnDemand()} />
      <Text>생체인증 권한 상태: {permissionState.biometric}</Text>
      <Text>캘린더 권한 상태: {permissionState.calendar}</Text>
      <Text>사진 권한 상태: {permissionState.photo}</Text>
    </SafeAreaView>
  );
}
