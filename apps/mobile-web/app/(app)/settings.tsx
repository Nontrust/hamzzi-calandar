import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { logout } from "../../src/authClient";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { useActiveRole } from "../src/auth/useActiveRole";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";

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

export default function SettingsPage() {
  const router = useRouter();
  const { setSession } = useAuthSession();
  const { clearRole } = useActiveRole();
  const [notice, setNotice] = useState("권한 및 계정 설정을 관리하세요.");
  const [permissionState, setPermissionState] = useState({
    biometric: "idle",
    calendar: "idle",
    photo: "idle"
  });

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
      setNotice("캘린더 권한 요청에 실패했습니다.");
    }
  }

  async function requestPhotoOnDemand() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPermissionState((prev) => ({ ...prev, photo: status }));
    } catch {
      setPermissionState((prev) => ({ ...prev, photo: "error" }));
      setNotice("사진 권한 요청에 실패했습니다.");
    }
  }

  async function onLogout() {
    await logout();
    await clearRole();
    setSession(null);
    setNotice("로그아웃되었습니다.");
    router.replace("/login");
  }

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>권한 관리</Text>
        <Text style={styles.sectionSub}>{notice}</Text>
        <View style={styles.actionsWrap}>
          <AppButton label="생체 인증" onPress={() => void requestBiometricOnDemand()} variant="secondary" />
          <AppButton label="캘린더" onPress={() => void requestCalendarOnDemand()} variant="secondary" />
          <AppButton label="사진 라이브러리" onPress={() => void requestPhotoOnDemand()} variant="secondary" />
        </View>
        <Text style={styles.permissionText}>생체 인증: {getPermissionLabel(permissionState.biometric)}</Text>
        <Text style={styles.permissionText}>캘린더: {getPermissionLabel(permissionState.calendar)}</Text>
        <Text style={styles.permissionText}>사진: {getPermissionLabel(permissionState.photo)}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>계정</Text>
        <AppButton label="로그아웃" onPress={() => void onLogout()} variant="danger" />
      </View>
    </ScrollView>
  );
}
