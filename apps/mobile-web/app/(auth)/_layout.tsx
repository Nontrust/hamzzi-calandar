import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { decideAuthRoute } from "../src/auth/routeGuards";
import { styles } from "../src/ui/appStyles";

export default function AuthLayout() {
  const { isBootstrapping, session } = useAuthSession();
  const decision = decideAuthRoute(isBootstrapping, session);

  if (decision === "loading") {
    return (
      <SafeAreaView style={styles.authRoot}>
        <View style={styles.authCard}>
          <ActivityIndicator size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (decision === "redirect") {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
