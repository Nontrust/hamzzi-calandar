import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { useAuthSession } from "../src/auth/AuthSessionProvider";
import { styles } from "../src/ui/appStyles";

export default function AuthLayout() {
  const { isBootstrapping, session } = useAuthSession();

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.authRoot}>
        <View style={styles.authCard}>
          <ActivityIndicator size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
