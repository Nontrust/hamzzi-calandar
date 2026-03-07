import { Stack } from "expo-router";
import { AuthSessionProvider } from "./src/auth/AuthSessionProvider";

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthSessionProvider>
  );
}
