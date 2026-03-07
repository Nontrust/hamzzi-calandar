import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Button, SafeAreaView, Text, TextInput, View } from "react-native";
import { canManageRewards, getRoleHelper, getRoleLabel, type UserRole } from "@nahamzzi/domain";
import { getAuthSession, login, logout, type AuthSession } from "../src/authClient";
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState("Login is required.");
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [apiNotice, setApiNotice] = useState("OK");
  const [monthItems, setMonthItems] = useState<Array<{ kind: "exam" | "anniversary"; date: string; title: string }>>([]);
  const [anniversaryIds, setAnniversaryIds] = useState<string[]>([]);
  const [permissionState, setPermissionState] = useState({ biometric: "idle", calendar: "idle", photo: "idle" });

  useEffect(() => {
    void initializeAuth();
  }, []);

  useEffect(() => {
    if (!session || !activeRole) {
      setMonthItems([]);
      setAnniversaryIds([]);
      return;
    }
    void refreshFromServer(activeRole);
  }, [session, activeRole]);

  async function initializeAuth() {
    const existing = await getAuthSession();
    setSession(existing);
    if (!existing) {
      setActiveRole(null);
      return;
    }
    const savedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
    if (savedRole === "A" || savedRole === "B") {
      setActiveRole(savedRole);
    } else {
      setActiveRole(existing.user.defaultRole);
      await AsyncStorage.setItem(ACTIVE_ROLE_KEY, existing.user.defaultRole);
    }
  }

  async function onLogin() {
    const result = await login(loginId, password);
    if (!result.success) {
      setLoginNotice(mapErrorToMessage(result.errorCode));
      return;
    }
    setSession(result.session);
    const role = result.session.user.defaultRole;
    setActiveRole(role);
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setLoginNotice(`Welcome, ${result.session.user.displayName}.`);
    setPassword("");
  }

  async function onLogout() {
    await logout();
    await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
    setSession(null);
    setActiveRole(null);
    setApiNotice("Logged out.");
  }

  async function selectRole(role: UserRole) {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRole(role);
  }

  async function refreshFromServer(role: UserRole) {
    const monthRes = await fetchCalendarMonth(role, "2026-03");
    if (monthRes.success) {
      setMonthItems(monthRes.data.items);
      setApiNotice("Month loaded");
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
    setApiNotice("Anniversary created");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function editFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("No anniversary to edit.");
      return;
    }
    const res = await renameAnniversary(activeRole, first, "Hamzzi Day");
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("Anniversary updated");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function deleteFirstAnniversary() {
    const first = anniversaryIds[0];
    if (!first) {
      setApiNotice("No anniversary to delete.");
      return;
    }
    const res = await removeAnniversary(activeRole, first);
    if (!res.success) {
      setApiNotice(mapErrorToMessage(res.errorCode));
      return;
    }
    setApiNotice("Anniversary deleted");
    if (activeRole) {
      await refreshFromServer(activeRole);
    }
  }

  async function requestBiometricOnDemand() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    setPermissionState((prev) => ({ ...prev, biometric: hasHardware ? "granted" : "unavailable" }));
  }

  async function requestCalendarOnDemand() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    setPermissionState((prev) => ({ ...prev, calendar: status }));
  }

  async function requestPhotoOnDemand() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setPermissionState((prev) => ({ ...prev, photo: status }));
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Login</Text>
        <TextInput
          placeholder="Login ID"
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10 }}
        />
        <Button title="Login" onPress={() => void onLogin()} />
        <Text>{loginNotice}</Text>
        <Text>Demo IDs: nahamzzi / deed1515</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Hamzzi Calendar</Text>
      <Text>User: {session.user.displayName} ({session.user.loginId})</Text>
      <Button title="Logout" onPress={() => void onLogout()} />

      <Text>Active role: {activeRole ? getRoleLabel(activeRole) : "none"}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title={`${getRoleLabel("A")} select`} onPress={() => void selectRole("A")} />
        <Button title={`${getRoleLabel("B")} select`} onPress={() => void selectRole("B")} />
      </View>

      <Text>Admin features: {activeRole && canManageRewards(activeRole) ? "allowed" : "blocked"}</Text>
      {activeRole === "A" ? <Text>{getRoleHelper("A")}</Text> : activeRole === "B" ? <Text>{getRoleHelper("B")}</Text> : <Text>Select role first.</Text>}

      <Text>Server notice: {apiNotice}</Text>
      <Text style={{ fontWeight: "700", marginTop: 8 }}>Month preview</Text>
      {monthItems.map((item) => (
        <View key={`${item.kind}-${item.date}-${item.title}`}>
          <Text>{item.kind === "anniversary" ? "Anniversary" : "Exam"} {item.date} {item.title}</Text>
        </View>
      ))}

      <Button title="Add anniversary" onPress={() => void addAnniversary()} />
      <Button title="Edit first anniversary" onPress={() => void editFirstAnniversary()} />
      <Button title="Delete first anniversary" onPress={() => void deleteFirstAnniversary()} />

      <Button title="Request biometric permission" onPress={() => void requestBiometricOnDemand()} />
      <Button title="Request calendar permission" onPress={() => void requestCalendarOnDemand()} />
      <Button title="Request photo permission" onPress={() => void requestPhotoOnDemand()} />
      <Text>Biometric permission: {permissionState.biometric}</Text>
      <Text>Calendar permission: {permissionState.calendar}</Text>
      <Text>Photo permission: {permissionState.photo}</Text>
    </SafeAreaView>
  );
}
