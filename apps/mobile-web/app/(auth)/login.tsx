import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, SafeAreaView, StatusBar, Text, TextInput, View } from "react-native";
import { login } from "../../src/authClient";
import { mapErrorToMessage } from "../../src/anniversaryClient";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { AppButton } from "../src/ui/AppButton";
import { styles } from "../src/ui/appStyles";
import { theme } from "../src/ui/theme";

const ACTIVE_ROLE_KEY = "active-role";
const BRAND_SYMBOL = require("../../../../openspec/statics/nahamzzi_symbol_fit.png");

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthSession();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState("로그인 후 서비스를 이용해 주세요.");

  async function onLogin() {
    const result = await login(loginId, password);
    if (!result.success) {
      setLoginNotice(mapErrorToMessage(result.errorCode));
      return;
    }

    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, result.session.user.defaultRole);
    setSession(result.session);
    setLoginNotice(`${result.session.user.displayName}님, 반가워요.`);
    setPassword("");
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.authRoot}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.authCard}>
        <View style={styles.authHero}>
          <View style={styles.authHeroGlowPrimary} />
          <View style={styles.authHeroGlowSecondary} />
          <Image source={BRAND_SYMBOL} style={styles.biImage} resizeMode="contain" accessible={false} />
        </View>
        <Text style={styles.authTitle}>로그인</Text>
        <Text style={styles.authSubtitle}>데모 계정으로 앱에 접속해 주세요.</Text>

        <TextInput
          placeholder="아이디"
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={theme.colors.textMuted}
        />

        <AppButton label="로그인" onPress={() => void onLogin()} />
        <Text style={styles.noticeText}>{loginNotice}</Text>

        <View style={styles.demoRow}>
          <Text style={styles.demoChip}>nahamzzi</Text>
          <Text style={styles.demoChip}>deed1515</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
