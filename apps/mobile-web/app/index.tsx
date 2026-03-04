import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Button, SafeAreaView, Text, View } from "react-native";
import {
  buildAnniversaryItem,
  buildCalendarMonthItems,
  canManageRewards,
  getBrandLabel,
  getRoleHelper,
  getRoleLabel,
  type UserRole
} from "@nahamzzi/domain";

const ACTIVE_ROLE_KEY = "active-role";

export default function HomeScreen() {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
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

  async function selectRole(role: UserRole) {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
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

  const today = "2026-03-04";
  const anniversaryItem = buildAnniversaryItem(
    { name: "햄찌데이", baseDate: "2025-11-25", dayOffset: 100 },
    today
  );
  const monthItems = buildCalendarMonthItems(
    "2026-03",
    [{ kind: "exam", date: "2026-03-12", title: "데이트데이 · [공기업] 필기시험" }],
    [anniversaryItem]
  );

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

      <Text style={{ fontWeight: "700", marginTop: 8 }}>이번 달 달력 미리보기</Text>
      {monthItems.map((item) => (
        <View key={`${item.kind}-${item.date}-${item.title}`} style={{ gap: 2 }}>
          <Text>
            {item.kind === "anniversary" ? "● 기념일" : "○ 일반 일정"} {item.date} {item.title}
          </Text>
          {item.kind === "anniversary" ? (
            <Text style={{ color: "#555" }}>
              {anniversaryItem.dDayLabel} ({anniversaryItem.hint})
            </Text>
          ) : null}
        </View>
      ))}

      <Button title="생체인증 권한 요청(필요할 때만)" onPress={() => void requestBiometricOnDemand()} />
      <Button title="캘린더 권한 요청(필요할 때만)" onPress={() => void requestCalendarOnDemand()} />
      <Button title="사진 권한 요청(필요할 때만)" onPress={() => void requestPhotoOnDemand()} />
      <Text>생체인증 권한 상태: {permissionState.biometric}</Text>
      <Text>캘린더 권한 상태: {permissionState.calendar}</Text>
      <Text>사진 권한 상태: {permissionState.photo}</Text>
    </SafeAreaView>
  );
}

