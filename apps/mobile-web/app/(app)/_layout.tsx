import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { decideAppRoute } from "../src/auth/routeGuards";
import { styles } from "../src/ui/appStyles";

export default function AppLayout() {
  const { isBootstrapping, session } = useAuthSession();
  const decision = decideAppRoute(isBootstrapping, session);

  if (decision === "loading") {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.headerCard}>
          <ActivityIndicator size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (decision === "redirect") {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
